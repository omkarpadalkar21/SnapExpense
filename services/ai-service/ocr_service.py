"""
ocr_service.py — PaddleOCR integration with spatial receipt parsing.

Root-cause history
──────────────────
v1  Flat line-based regex — no spatial awareness.  Items always [].
v2  Spatial row grouping added (Y-range overlap).  Hidden IndexError:
    Block tuple had 5 fields but code accessed b[6] (y_max that didn't
    exist) → IndexError caught silently by the outer try/except
    → _create_empty_receipt_data() every time → items still [].
v3  (this file) All bugs fixed:
    1. Block extended to 9 fields including y_min/y_max — no more IndexError.
    2. Row grouping uses Y-range overlap with a CAPPED gap tolerance so
       tight-spaced receipts don't get merged into one giant row.
    3. Orphan-row merge: a text-only row followed by a numbers-only row
       is merged before parsing (safety net for residual grouping failures).
    4. _expand_merged_cols correctly detects space-separated number tokens
       like "1 295.00 309.75" (one PaddleOCR detection, three columns).
    5. _should_skip_row no longer blocks product names that contain the
       words "item", "rate", or "description".  Column-header rows are
       detected by requiring ≥2 header words with no decimal prices.
    6. _is_header_noise is general-purpose (no hardcoded city/company names).
"""

# Must be set BEFORE paddle/paddleocr is imported — the executor choice and
# oneDNN backend are resolved at import/init time, not at call time.
# FLAGS_enable_pir_api=0  → use the old dynamic executor (avoids PIR crash)
# FLAGS_use_mkldnn=0      → disable the oneDNN backend that raises the error
import os
os.environ['FLAGS_enable_pir_api'] = '0'
os.environ['FLAGS_use_mkldnn'] = '0'
os.environ.setdefault('PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK', 'True')

import re
import logging
import tempfile
from datetime import datetime
from typing import List, Tuple, Optional

from PIL import Image, ImageEnhance
import numpy as np
from paddleocr import PaddleOCR
from models import OcrExtractedData, ReceiptItemDTO

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Block = (cx, cy, text, confidence, height, y_min, y_max, x_min, x_max)
#          0    1    2       3         4       5      6      7      8
#
# IMPORTANT: all 9 fields must be present.  Previous version only had 5
# fields (cx, cy, text, conf, height); accessing b[6] caused IndexError.
# ---------------------------------------------------------------------------
Block = Tuple[float, float, str, float, float, float, float, float, float]


class OCRService:

    def __init__(self):
        self.ocr = PaddleOCR(
            use_angle_cls=True,
            lang='en',
            rec_batch_num=6,
        )

    # ═══════════════════════════════════════════════════════════════════════
    # Public interface
    # ═══════════════════════════════════════════════════════════════════════

    def _preprocess_image(self, image_path: str) -> str:
        """Enhance contrast and sharpness for low-quality receipt images."""
        img = Image.open(image_path).convert('RGB')

        # 1. Resize if too small — PaddleOCR struggles under 1000px tall
        w, h = img.size
        if h < 1000:
            scale = 1000 / h
            img = img.resize((int(w * scale), 1000), Image.LANCZOS)

        # 2. Convert to grayscale for receipts (removes color noise)
        img = img.convert('L')

        # 3. Boost contrast
        img = ImageEnhance.Contrast(img).enhance(2.0)

        # 4. Sharpen
        img = ImageEnhance.Sharpness(img).enhance(2.0)

        # 5. Convert back to RGB (PaddleOCR expects RGB)
        img = img.convert('RGB')

        # Save to a temp file and return path
        suffix = os.path.splitext(image_path)[1] or '.jpg'
        tmp = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
        img.save(tmp.name, quality=95)
        tmp.close()
        logger.debug(f"Preprocessed image saved to {tmp.name}")
        return tmp.name

    def extract_text_from_image(self, image_path: str) -> List[List]:
        preprocessed_path = None
        try:
            preprocessed_path = self._preprocess_image(image_path)
            # cls kwarg was removed in PaddleOCR v3 — angle cls is set at init
            result = self.ocr.ocr(preprocessed_path)
            if not result or not result[0]:
                logger.warning("OCR returned no detections")
                return [[]]

            # PaddleOCR v3 may return a list of dicts instead of a list of
            # [[bbox, (text, conf)], ...] lists.  Normalise to the v2 shape so
            # _to_blocks doesn't need to change.
            first = result[0]
            if isinstance(first, dict):
                boxes  = first.get('boxes',  first.get('det_polys', []))
                texts  = first.get('texts',  first.get('rec_texts',  []))
                scores = first.get('scores', first.get('rec_scores', []))
                result = [
                    [[box, (text, score)]
                     for box, text, score in zip(boxes, texts, scores)]
                ]

            logger.info(f"OCR returned {len(result[0])} detections")
            return result
        except Exception as e:
            logger.error(f"PaddleOCR failed: {e}")
            raise Exception(f"OCR processing failed: {e}")
        finally:
            if preprocessed_path and preprocessed_path != image_path:
                try:
                    os.unlink(preprocessed_path)
                except OSError:
                    pass

    def parse_receipt_data(self, paddleocr_result: List[List]) -> OcrExtractedData:
        try:
            if not paddleocr_result or not paddleocr_result[0]:
                return self._empty()

            # Step 1 — Raw detections → Block tuples (9 fields each)
            blocks = self._to_blocks(paddleocr_result[0])
            if not blocks:
                return self._empty()
            logger.info(f"Converted {len(blocks)} blocks")

            # Step 2 — Cluster blocks into rows via Y-range overlap
            rows = self._group_into_rows(blocks)
            logger.info(f"Grouped into {len(rows)} rows")

            # Step 3 — Within each row: sort left→right preserving top→bottom
            #          for tokens in the same column.
            #
            # Plain cx sort breaks wrapped multi-line item names:
            #   "HYDERABADI MURG"  cx=240  (wider first line)
            #   "BIRYANI"          cx=200  (shorter wrap line → smaller cx)
            # → plain sort yields "BIRYANI HYDERABADI MURG"  ← wrong order
            #
            # Fix: bucket X into 50 px column bins, then break ties by y_min
            # so tokens that wrap within the same column read top→bottom.
            # b[7]=x_min, b[5]=y_min
            row_texts = [
                "\t".join(
                    b[2]
                    for b in sorted(row, key=lambda b: (int(b[7] / 50), b[5]))
                )
                for row in rows
            ]

            # Step 4 — Orphan-row merge (safety net)
            row_texts = self._merge_orphan_rows(row_texts)
            logger.debug("Row texts:\n" + "\n".join(f"  {r!r}" for r in row_texts))

            # Step 5 — Field extraction
            flat = [b[2] for b in sorted(blocks, key=lambda b: (b[1], b[0]))]
            all_text  = " ".join(flat)
            avg_conf  = sum(b[3] for b in blocks) / len(blocks)

            merchant = self._extract_merchant(flat)
            total    = self._extract_total(flat)
            date     = self._extract_date(flat)
            items    = self._extract_items(row_texts, total)

            logger.info(
                f"Result — merchant={merchant!r} total={total} "
                f"date={date} items={len(items)} conf={avg_conf:.3f}"
            )
            return OcrExtractedData(
                merchantName=merchant,
                totalAmount=total or 0.0,
                receiptDate=date,
                items=items,
                ocrRawText=all_text,
                ocrConfidence=round(avg_conf, 3),
            )

        except Exception as e:
            logger.error(f"parse_receipt_data failed: {e}", exc_info=True)
            return self._empty()

    # ═══════════════════════════════════════════════════════════════════════
    # Block conversion  (FIX 1 — all 9 fields populated)
    # ═══════════════════════════════════════════════════════════════════════

    def _to_blocks(self, raw: list) -> List[Block]:
        blocks: List[Block] = []
        for det in raw:
            if not det or len(det) < 2:
                continue
            bbox       = det[0]
            text, conf = det[1][0].strip(), det[1][1]
            if not text:
                continue
            xs = [pt[0] for pt in bbox]
            ys = [pt[1] for pt in bbox]
            x_min, x_max = min(xs), max(xs)
            y_min, y_max = min(ys), max(ys)
            cx = (x_min + x_max) / 2
            cy = (y_min + y_max) / 2
            h  = y_max - y_min
            blocks.append((cx, cy, text, conf, h, y_min, y_max, x_min, x_max))
        return blocks

    # ═══════════════════════════════════════════════════════════════════════
    # Row grouping  (FIX 1 + FIX 2a)
    # ═══════════════════════════════════════════════════════════════════════

    def _group_into_rows(self, blocks: List[Block]) -> List[List[Block]]:
        if not blocks:
            return []

        sorted_blocks = sorted(blocks, key=lambda b: b[1])  # sort by cy

        heights = sorted(b[4] for b in sorted_blocks if b[4] > 0)
        median_h = heights[len(heights) // 2] if heights else 20.0

        # Two blocks belong to the same row only if their CENTER Y values
        # are within half a line height of each other.
        # This avoids the snowball problem of y_max creeping downward.
        same_row_threshold = median_h * 0.5
        logger.debug(f"Row grouping: median_h={median_h:.1f} threshold={same_row_threshold:.1f}")

        rows: List[List[Block]] = []
        current_row: List[Block] = [sorted_blocks[0]]
        row_cy_avg: float = sorted_blocks[0][1]  # b[1] = cy

        for block in sorted_blocks[1:]:
            if abs(block[1] - row_cy_avg) <= same_row_threshold:
                current_row.append(block)
                # Update rolling average cy of the row
                row_cy_avg = sum(b[1] for b in current_row) / len(current_row)
            else:
                rows.append(current_row)
                current_row = [block]
                row_cy_avg = block[1]

        rows.append(current_row)
        return rows

    # ═══════════════════════════════════════════════════════════════════════
    # Orphan-row merge  (FIX 2b — safety net)
    # ═══════════════════════════════════════════════════════════════════════

    _DECIMAL_RE = re.compile(r'\d+[.,]\d{1,2}')
    _NUMONLY_RE = re.compile(r'^[\d\s\t.,₹$%+\-]+$')
    # Matches a numbers-only row that contains AT LEAST ONE decimal price
    # (qty alone like "1" should NOT trigger a merge — it's ambiguous)
    _PRICE_ROW_RE = re.compile(r'\d+[.,]\d{1,2}')

    def _merge_orphan_rows(self, rows: List[str]) -> List[str]:
        """
        Merge a text-only row with the immediately following numbers-only row,
        BUT only when the next row contains AT LEAST ONE decimal price token.
        This prevents merging item-name rows with a bare quantity '1' that
        actually belongs to the next item.

        Example:
          "Tandoori chicken"   +   "1\t295.00\t309.75"
          →  "Tandoori chicken\t1\t295.00\t309.75"
        Counter-example (do NOT merge):
          "Some item name"   +   "1"   (next row is another item's qty only)
        """
        out, i = [], 0
        while i < len(rows):
            row = rows[i]
            # Row has no decimal → might be a pure-text orphan name
            if not self._DECIMAL_RE.search(row) and i + 1 < len(rows):
                nxt = rows[i + 1]
                # Only merge if the next row is purely numeric AND has a decimal price
                if (self._NUMONLY_RE.match(nxt.replace('\t', ' '))
                        and self._PRICE_ROW_RE.search(nxt)):
                    logger.debug(f"Orphan merge: {row!r} + {nxt!r}")
                    out.append(row + "\t" + nxt)
                    i += 2
                    continue
            out.append(row)
            i += 1
        return out

    # ═══════════════════════════════════════════════════════════════════════
    # Merchant
    # ═══════════════════════════════════════════════════════════════════════

    def _extract_merchant(self, flat: List[str]) -> str:
        for tok in flat:
            s = tok.strip()
            if s and not self._is_date_or_amount(s) and not self._is_header_noise(s):
                return s
        return ""

    # ═══════════════════════════════════════════════════════════════════════
    # Total amount
    # ═══════════════════════════════════════════════════════════════════════

    _TOTAL_RE = re.compile(
        r'\bTotal[:\s]*[^0-9₹$]*[₹$]?\s*([\d,]+\.?\d*)',
        re.IGNORECASE,
    )
    _TAX_SKIP_RE = re.compile(
        r'\b(total\s+tax|sub.?total|cgst|sgst|igst|vat|s\.?tax|service.tax|discount)\b',
        re.IGNORECASE,
    )

    def _extract_total(self, flat: List[str]) -> Optional[float]:
        # Pass 1 — "Total" token followed immediately by a number token
        for i, tok in enumerate(flat):
            if self._TAX_SKIP_RE.search(tok):
                continue
            # Check if this token contains "Total" + number in one string
            # Handles: "Total:1,650.00Rs", "Total 1650.00", "Total: 1,650.00"
            m = self._TOTAL_RE.search(tok)
            if m:
                try:
                    # Strip trailing non-numeric chars (e.g. "Rs", "/-")
                    raw = re.sub(r'[^\d,.]', '', m.group(1))
                    v = float(raw.replace(',', ''))
                    if 0 < v < 10_000_000:
                        return v
                except ValueError:
                    pass
            # Check if this token IS "Total" and the NEXT token is the number
            if re.match(r'^\s*Total[:\s]*$', tok, re.IGNORECASE):
                # Check PREVIOUS token (OCR reads right col first)
                if i > 0:
                    try:
                        v = float(flat[i - 1].replace(',', '').replace(' ', ''))
                        if 0 < v < 10_000_000:
                            return v
                    except ValueError:
                        pass
                # Also check NEXT token (normal left-to-right layout)
                if i + 1 < len(flat):
                    try:
                        raw = re.sub(r'[^\d,.]', '', flat[i + 1])
                        v = float(raw.replace(',', '').strip())
                        if 0 < v < 10_000_000:
                            return v
                    except ValueError:
                        pass

        # Pass 2 — largest plausible number, skipping dates AND phone numbers
        _date_re = re.compile(
            r'\d{4}[/-]\d{1,2}[/-]\d{1,2}'
            r'|\d{1,2}[-/][A-Za-z]{3,9}[-/]\d{2,4}'
            r'|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}'
        )
        # Phone number pattern — catches "0129-4360377" and "Ph.No.:..."
        _phone_re = re.compile(
            r'\b(Ph(\s*\.\s*No\.?)?|Phone|Tel|Fax|Mobile|Mob)[\s.:]*[\d\s\-()]{6,}',
            re.IGNORECASE
        )
        best: Optional[float] = None
        for tok in flat:
            if self._is_header_noise(tok) or self._TAX_SKIP_RE.search(tok):
                continue
            if _date_re.search(tok) or _phone_re.search(tok):
                continue
            # Skip tokens that look like standalone phone numbers
            if re.match(r'^[\d\-+()\s]{8,}$', tok.strip()):
                continue
            for num in re.findall(r'[\d,]+\.?\d*', tok):
                try:
                    v = float(num.replace(',', ''))
                    if 0 < v < 10_000_000 and (best is None or v > best):
                        best = v
                except ValueError:
                    pass
        return best

    # ═══════════════════════════════════════════════════════════════════════
    # Date
    # ═══════════════════════════════════════════════════════════════════════

    _DATE_PATS = [
        # ISO format MUST come first — otherwise "2026-03-15" is matched as
        # "26-03-15" by the short DD/MM/YY pattern below, giving the wrong date.
        r'(\d{4}[/-]\d{1,2}[/-]\d{1,2})',              # 2026-03-15  ← FIRST
        r'(\d{1,2}[-/]\s*[A-Za-z]{3,9}[-/]\s*\d{2,4})',# 20-May-18
        r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',             # 20/05/18
        r'(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4})',         # 20 May 18
    ]
    _DATE_FMTS = [
        '%d-%b-%y', '%d/%b/%y', '%d %b %y',   # 2-digit year FIRST
        '%d-%m-%y', '%d/%m/%y',
        '%d-%b-%Y', '%d/%b/%Y', '%d %b %Y',   # 4-digit year
        '%d-%m-%Y', '%d/%m/%Y',
        '%Y-%m-%d', '%Y/%m/%d',
    ]

    def _extract_date(self, flat: List[str]) -> Optional[str]:
        for tok in flat:
            for pat in self._DATE_PATS:
                m = re.search(pat, tok)
                if m:
                    nd = self._norm_date(m.group(1).strip())
                    if nd:
                        return nd
        return None

    def _norm_date(self, s: str) -> Optional[str]:
        s = re.sub(r'\s+', ' ', s).strip()
        for fmt in self._DATE_FMTS:
            try:
                return datetime.strptime(s, fmt).strftime('%Y-%m-%d')
            except ValueError:
                continue
        return None

    # ═══════════════════════════════════════════════════════════════════════
    # Item extraction
    # ═══════════════════════════════════════════════════════════════════════

    def _extract_items(self, rows: List[str], total: Optional[float]) -> List[ReceiptItemDTO]:
        """
        Fallback to flat-token sliding window when spatial grouping fails.
        Looks for the pattern: DECIMAL  DECIMAL  INT  NAME_WORDS
        reading right-to-left in the flat OCR token stream.
        """
        items: List[ReceiptItemDTO] = []

        # First try row-based parsing (works when grouping is clean)
        for row in rows:
            if self._should_skip_row(row):
                continue
            cols = [c.strip() for c in re.split(r'\t|  +', row) if c.strip()]
            if len(cols) < 2:
                continue
            # Pre-process: detach a trailing lone digit stuck to the last text
            # column (OCR merges qty into item name, e.g. "Veg Soup1" → ["Veg Soup", "1"])
            if cols:
                last_text_idx = next(
                    (i for i in range(len(cols) - 1, -1, -1)
                     if not self._is_numeric_col(cols[i])),
                    None
                )
                if last_text_idx is not None:
                    m = re.match(r'^(.+?)(\d+)$', cols[last_text_idx])
                    if m and len(m.group(2)) <= 2:
                        cols[last_text_idx] = m.group(1).strip()
                        cols.insert(last_text_idx + 1, m.group(2))
            cols = self._expand_merged_cols(cols)
            item = self._parse_columns(cols)
            if item:
                logger.debug(
                    f"Item: {item.name!r} qty={item.quantity} "
                    f"unit={item.unitPrice} total={item.totalPrice}"
                )
                items.append(item)

        if items:
            logger.info(f"Row-based parsing found {len(items)} items")
            return items

        # Fallback: flat token stream window parser
        logger.info("Falling back to flat-token stream parser")
        return self._extract_items_from_flat_tokens(rows)

    def _extract_items_from_flat_tokens(self, rows: List[str]) -> List[ReceiptItemDTO]:
        """
        Parse items from flat token stream using sliding window.

        Supports two receipt column orderings:
          A) Right-to-left total→rate→qty→name:  "309.75  295.00  1  Tandoori chicken"
          B) Left-to-right name→qty→rate→total:  "Tandoori chicken  1  295.00  309.75"
        """
        items: List[ReceiptItemDTO] = []

        # Process row by row so tokens don't bleed across item boundaries
        for row in rows:
            if self._should_skip_row(row):
                continue
            toks = [t for t in re.split(r'\t|  +|\s+', row) if t.strip()]
            if not toks:
                continue

            # ── Pattern A: total  rate  qty  name...  (right-to-left) ─────────
            # First token is a decimal, second is a decimal, third is an integer
            if (len(toks) >= 4 and
                    self._CLEAN_AMT.match(toks[0].replace(',', '')) and
                    self._CLEAN_AMT.match(toks[1].replace(',', '')) and
                    self._CLEAN_QTY.match(toks[2].replace(',', ''))
            ):
                total_price = float(toks[0].replace(',', ''))
                rate        = float(toks[1].replace(',', ''))
                qty         = float(toks[2].replace(',', ''))
                name = " ".join(toks[3:]).strip()
                if len(name) >= 2 and 0 < total_price < 1_000_000:
                    items.append(ReceiptItemDTO(
                        name=name,
                        quantity=qty,
                        unitPrice=round(rate, 2),
                        totalPrice=round(total_price, 2),
                    ))
                    continue

            # ── Pattern B: name...  qty  rate  total  (left-to-right) ─────────
            # Walk backwards from end: collect decimals, then optional integer qty
            rev = list(reversed(toks))
            numbers: List[str] = []
            name_end = len(toks)
            has_dec = False
            for k, t in enumerate(rev):
                c = t.replace(',', '')
                if self._CLEAN_AMT.match(c):
                    numbers.insert(0, c)
                    has_dec = True
                elif self._CLEAN_QTY.match(c) and len(numbers) >= 1 and len(numbers) <= 2:
                    # Integer qty/rate after at least one number already collected
                    numbers.insert(0, c)
                elif self._MIN_INT_PRICE.match(c) and len(numbers) == 0:
                    # 2+ digit whole-number price — start collecting
                    numbers.insert(0, c)
                else:
                    name_end = len(toks) - k
                    break
            # For integer-price receipts, require ≥2 numbers (not just a stray digit)
            if not has_dec and len(numbers) < 2:
                numbers = []

            if len(numbers) >= 2:
                name = " ".join(toks[:name_end]).strip()
                if len(name) >= 2:
                    try:
                        if len(numbers) >= 3:
                            qty   = float(numbers[0])
                            rate  = float(numbers[1])
                            total = float(numbers[2])
                        else:
                            # 2 numbers: [qty_or_rate, total]
                            if re.match(r'^\d+$', numbers[0]):
                                qty   = float(numbers[0])
                                total = float(numbers[1])
                                rate  = round(total / qty, 2) if qty else total
                            else:
                                qty   = 1.0
                                rate  = float(numbers[0])
                                total = float(numbers[1])
                        if 0 < total < 1_000_000:
                            items.append(ReceiptItemDTO(
                                name=name,
                                quantity=qty,
                                unitPrice=round(rate, 2),
                                totalPrice=round(total, 2),
                            ))
                            continue
                    except (ValueError, ZeroDivisionError):
                        pass

        return items

    # ── FIX 4: expand merged number tokens ──────────────────────────────────

    _CLEAN_AMT   = re.compile(r'^[\d,]+\.\d{1,2}$')
    _CLEAN_QTY   = re.compile(r'^\d+(\.\d+)?$')
    _ALL_NUMS    = re.compile(r'^[\d,]+\.?\d*$')
    # 2+ digit whole-number price (receipts that print 144 instead of 144.00)
    _MIN_INT_PRICE = re.compile(r'^\d{2,}$')

    # Matches jammed OCR tokens like "1177.97177.97" or "1288.14288.14"
    # Pattern: one or more digits (qty), then pairs of decimal-price amounts
    _JAMMED_AMT_RE = re.compile(
        r'^(\d+)((?:\d+\.\d{1,2}){1,3})$'
    )

    def _split_jammed_amounts(self, cols: List[str]) -> List[str]:
        """
        Split OCR-jammed tokens where qty and prices are concatenated without
        separators.  Handles all forms seen in this receipt format:

          "1177.97177.97"  → ["1", "177.97", "177.97"]   (qty + price + total)
          "184.7584.75"    → ["184.75", "84.75"]          (price + total, no qty)
          "1288.14"        → ["1", "288.14"]              (qty prefix on single price)
        """
        result: List[str] = []
        for col in cols:
            c = col.replace(',', '').strip()
            # Skip anything that isn't a pure numeric string
            if not re.match(r'^\d[\d.]*$', c):
                result.append(col)
                continue
            # Already a clean single amount — keep as-is
            if self._CLEAN_AMT.match(c) or self._CLEAN_QTY.match(c):
                result.append(col)
                continue

            # Extract all X.YY decimal sub-tokens greedily from the string
            decimal_parts = re.findall(r'\d+\.\d{2}', c)

            if len(decimal_parts) >= 2:
                # Multiple decimal amounts found
                rejoined = ''.join(decimal_parts)
                if rejoined == c:
                    # Pure jammed amounts, e.g. "177.97177.97"
                    result.extend(decimal_parts)
                    continue
                # Check for leading integer qty prefix
                leftover = c[: len(c) - len(rejoined)]
                if leftover and re.match(r'^\d+$', leftover):
                    # e.g. "1177.97177.97" → "1" + ["177.97", "177.97"]
                    result.append(leftover)
                    result.extend(decimal_parts)
                    continue

            elif len(decimal_parts) == 1:
                # Single decimal amount — check for leading integer qty prefix
                amt_str = decimal_parts[0]
                idx = c.index(amt_str)
                leftover = c[:idx]
                if leftover and re.match(r'^\d+$', leftover):
                    # e.g. "1288.14" → qty "1" + price "288.14"
                    result.append(leftover)
                    result.extend(decimal_parts)
                    continue

            # Fallback: keep original
            result.append(col)
        return result

    def _is_numeric_col(self, s: str) -> bool:
        """True if `s` is a clean number OR a space-separated list of numbers."""
        c = s.replace(',', '')
        if self._CLEAN_AMT.match(c) or self._CLEAN_QTY.match(c):
            return True
        parts = s.split()
        return (
            len(parts) > 1
            and all(self._ALL_NUMS.match(p.replace(',', '')) for p in parts)
        )

    def _expand_merged_cols(self, cols: List[str]) -> List[str]:
        """
        Sub-split space-separated number tokens so "1 295.00 309.75" becomes
        three separate columns ["1", "295.00", "309.75"].

        Also handles jammed OCR tokens via _split_jammed_amounts:
          "1177.97177.97" → ["1", "177.97", "177.97"]

        Walk right-to-left to find where the numeric section starts, then
        expand any merged tokens within that section.
        """
        # Step 0 — pre-split any jammed amount tokens in the full cols list
        cols = self._split_jammed_amounts(cols)

        # Find split point between name cols and numeric cols
        split_idx = len(cols)
        for i in range(len(cols) - 1, -1, -1):
            if self._is_numeric_col(cols[i]):
                split_idx = i
            else:
                break   # first non-numeric from the right = name boundary

        name_cols   = cols[:split_idx]
        number_cols = cols[split_idx:]

        # Expand any space-separated merged tokens
        expanded: List[str] = []
        for col in number_cols:
            parts = col.split()
            if (len(parts) > 1
                    and all(self._ALL_NUMS.match(p.replace(',', '')) for p in parts)):
                expanded.extend(parts)
            else:
                expanded.append(col)

        return name_cols + expanded

    # ── Column → ReceiptItemDTO ──────────────────────────────────────────────

    def _parse_columns(self, cols: List[str]) -> Optional[ReceiptItemDTO]:
        """
        Walk right-to-left collecting numeric tokens; everything to the left
        is the item name.

        Rules for accepting a trailing token as numeric:
          - It passes _CLEAN_AMT (e.g. "295.00")  → always accept
          - It passes _CLEAN_QTY (plain integer)   → accept ONLY if we have
            already collected at least 1 decimal price, so a lone "1" in the
            middle of a name doesn't get absorbed into the numeric group.

        3+ numbers → qty, unit_price, total_price
        2  numbers → disambiguate qty+total vs unit+total
        1  number  → total_price (qty=1, unit=total)
        """
        numeric: List[str] = []
        name_end = 0
        has_decimal = False
        for i in range(len(cols) - 1, -1, -1):
            c = cols[i].replace(',', '')
            if self._CLEAN_AMT.match(c):
                # Decimal price — always counts as a number column
                numeric.insert(0, c)
                has_decimal = True
            elif (self._CLEAN_QTY.match(c)
                  and len(numeric) >= 1
                  and len(numeric) <= 2):
                # Integer qty/rate after at least one number already collected
                numeric.insert(0, c)
            elif (self._MIN_INT_PRICE.match(c)
                  and len(numeric) == 0):
                # 2+ digit whole-number price starts the numeric block
                # (handles receipts that print 144 instead of 144.00)
                numeric.insert(0, c)
            else:
                name_end = i + 1
                break

        if not numeric:
            return None
        # Accept if we have a decimal price OR ≥2 numbers (integer-price receipt)
        if not has_decimal and len(numeric) < 2:
            return None
        name = " ".join(cols[:name_end]).strip()
        if len(name) < 2:
            return None

        try:
            # After the existing len(numeric) >= 3 block, add:
            if len(numeric) >= 3:
                qty, unit, total = float(numeric[0]), float(numeric[1]), float(numeric[2])
                # Verify: qty * unit should roughly equal total (within 5%)
                if qty > 0 and unit > 0 and not (0.95 <= (qty * unit) / total <= 1.05):
                    # Try Rate | Qty | Amount order instead
                    rate_first, qty_second, total_check = qty, unit, total
                    if qty_second > 0 and abs(rate_first * qty_second - total_check) / total_check <= 0.05:
                        qty, unit, total = qty_second, rate_first, total_check
                    else:
                        # OCR prefix artifact: "1288.14" is actually qty=1 + price=288.14
                        # numeric[0]=1.0, numeric[1]=1288.14, numeric[2]=288.14
                        # Check if stripping a leading "1" from numeric[1] makes qty*unit=total
                        unit_str = numeric[1]
                        if unit_str.startswith('1') and len(unit_str) > 1:
                            stripped = unit_str[1:]  # remove leading "1"
                            try:
                                stripped_val = float(stripped)
                                if (abs(qty * stripped_val - total) / max(total, 0.01)) <= 0.05:
                                    unit = stripped_val
                            except ValueError:
                                pass
            elif len(numeric) == 2:
                # Disambiguate [qty, total] vs [unit_price, total]:
                # If the first number is a plain integer (no decimal) it is
                # almost always a quantity.  "2" then "280.00" → qty=2,
                # total=280.00, unit=140.00.  "140.00" then "280.00" →
                # qty=1, unit=140.00, total=280.00.
                if re.match(r'^\d+$', numeric[0]):
                    qty   = float(numeric[0])
                    total = float(numeric[1])
                    unit  = round(total / qty, 2) if qty else total
                else:
                    qty   = 1.0
                    unit  = float(numeric[0])
                    total = float(numeric[1])
            else:
                qty   = 1.0
                total = float(numeric[0])
                unit  = total

            if not (0 < total < 1_000_000):
                return None

            return ReceiptItemDTO(
                name=name,
                quantity=qty,
                unitPrice=round(unit, 2),
                totalPrice=round(total, 2),
            )
        except ValueError:
            return None

    # ═══════════════════════════════════════════════════════════════════════
    # Skip / noise helpers  (FIX 5 + FIX 6)
    # ═══════════════════════════════════════════════════════════════════════

    def _should_skip_row(self, row: str) -> bool:
        """
        FIX 5: Removed single-word skip triggers "item", "rate", "description".
        Those words appear legitimately in product names on any receipt.
        Column-header rows are now detected by requiring ≥ 2 header words
        AND no decimal prices — this pattern is unambiguous.
        """
        rl = row.lower().strip()
        if not rl or len(rl) < 3:
            return True

        # Tax / summary lines (including "Food Total", "Net Total", "Bill Total")
        if re.search(
            r'\b(grand.?total|sub.?total|food.?total|net.?total|bill.?total'
            r'|cgst|sgst|igst|vat|s\.?tax|service.tax'
            r'|service.charge|discount|surcharge|gratuity)\b', rl
        ):
            return True

        # Grand-total line  ("Total:  1139.00")
        if re.match(r'^\s*total[\s\t:₹$]+', rl):
            return True
        # Quantity-summary lines: "Qty 10", "Qty10", "Qty : 5" etc.
        if re.match(r'^\s*qty\s*[:\d]', rl):
            return True

        # Cash / payment footer lines
        # Also catches OCR misreads: "RET EIVED", "REC EIVED", "RECELVED"
        if re.match(r'^\s*(cash\s+received|non\s+a/?c|round\s+amount)\b', rl):
            return True
        if re.search(r'\b(received|ret\s*eived|rec\s*eived|recel?ved)\b', rl):
            return True
        # Standalone tax/tip/fee summary labels — match ONLY when the row
        # consists of just the label plus an optional number (no multi-word
        # product name).  Examples that should skip: "TAX  1.09", "TIP  5.00"
        # Examples that should NOT skip: "Pre-tax bundle  1  50.00  52.50"
        if re.match(r'^\s*(tax|tip|fee|levy)\s*[\t:₹$\d]', rl):
            return True

        # Column-header row: ≥ 2 header words with NO decimal prices
        header_hits = sum(
            1 for w in [
                'qty', 'quantity', 'rate', 'price', 'amount',
                'total', 'item', 'description', 'no', 'unit', 'sl',
            ]
            if re.search(rf'\b{w}\b', rl)
        )
        if header_hits >= 2 and not re.search(r'\d+[.,]\d{2}', row):
            return True

        # Rows containing only numbers / symbols
        if re.match(r'^[\t\s₹$\d,.%+\-–—|]+$', row):
            return True

        # Receipt boilerplate
        if self._is_header_noise(row):
            return True

        return False

    def _is_header_noise(self, line: str) -> bool:
        """
        FIX 6: General-purpose boilerplate detection (no hardcoded city/company
        names).  Matches structural patterns that apply to ANY receipt.
        """
        patterns = [
            # ADD this to the patterns list in _is_header_noise:
            r'\b[A-Za-z][\w\s]+-\d{5,6}\b',   # "Faridabad-121003" style address
            r'^\d{1,4}/\d+\s+\w',              # "11/2 Sector" style address line
            # Tax registration IDs
            r'\b(GSTIN|GSTR|PAN|VAT\s*No\.?|TIN|EIN|ABN)\b',
            # Invoice / bill reference headers
            r'\b(Invoice|Receipt|Bill|Order|Transaction)\s*(No\.?|Number|Date|ID|#)\b',
            # Phone / fax lines (generic)
            r'\b(Ph(one)?(\s*\.?\s*No\.?)?|Tel|Fax|Mobile|Mob)[\s.:]*\+?[\d\s\-()]{6,}',
            # Phone-number-only lines
            r'(\+?\d{1,3}[\s\-]?)?\(?\d{3}\)?[\s\-]\d{3,4}[\s\-]\d{4}',
            # Thank-you / closing messages
            r'\b(Thank|Thanks|Please\s+come|Visit\s+again|Goodbye|For\s+Visit)\b',
            # Web / email addresses
            r'\b(www\.|\.com|\.in|\.net|\.org|@)\b',
            # Alphanumeric receipt/invoice IDs  (e.g. "IN001001259", "TXN8837261")
            r'^[A-Z]{2,5}\d{6,}$',
        ]
        for pat in patterns:
            if re.search(pat, line, re.IGNORECASE):
                return True
        return False

    def _is_date_or_amount(self, line: str) -> bool:
        for pat in self._DATE_PATS:
            if re.search(pat, line):
                return True
        if re.match(r'^[₹$]?\s*[\d,]+\.?\d*\s*$', line.strip()):
            return True
        return False

    # ═══════════════════════════════════════════════════════════════════════
    def _empty(self) -> OcrExtractedData:
        return OcrExtractedData(
            merchantName="", totalAmount=0.0,
            receiptDate=None, items=[],
            ocrRawText="", ocrConfidence=0.0,
        )


ocr_service = OCRService()