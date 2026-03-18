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

import re
import logging
from datetime import datetime
from typing import List, Tuple, Optional
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
            det_db_score_mode='slow',
            rec_batch_num=6,
        )

    # ═══════════════════════════════════════════════════════════════════════
    # Public interface
    # ═══════════════════════════════════════════════════════════════════════

    def extract_text_from_image(self, image_path: str) -> List[List]:
        try:
            result = self.ocr.ocr(image_path, cls=True)
            if not result or not result[0]:
                logger.warning("OCR returned no detections")
                return [[]]
            logger.info(f"OCR returned {len(result[0])} detections")
            return result
        except Exception as e:
            logger.error(f"PaddleOCR failed: {e}")
            raise Exception(f"OCR processing failed: {e}")

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
        """
        Cluster blocks into rows using Y-range overlap.

        Two blocks belong to the same row when block.y_min ≤ row_y_max + tol,
        where tol is a small extra allowance for imperfect alignment.

        The tolerance is capped at `max_gap` to prevent tight-spaced receipts
        from having all rows collapsed into one (which happened when jitter
        was large relative to line spacing).
        """
        if not blocks:
            return []

        sorted_blocks = sorted(blocks, key=lambda b: b[1])   # sort by cy

        heights  = sorted(b[4] for b in sorted_blocks if b[4] > 0)
        median_h = heights[len(heights) // 2] if heights else 20.0

        # Allow up to 40 % of line height as an extra within-row gap, but
        # never more than 15 px — this prevents adjacent rows from merging
        # when the image has tight line spacing.
        gap_tolerance = min(median_h * 0.4, 15.0)
        logger.debug(f"Row grouping: median_h={median_h:.1f} tol={gap_tolerance:.1f}")

        rows: List[List[Block]]  = []
        current_row: List[Block] = [sorted_blocks[0]]
        row_y_max: float         = sorted_blocks[0][6]   # b[6] = y_max ✓

        for block in sorted_blocks[1:]:
            block_y_min = block[5]                         # b[5] = y_min ✓
            if block_y_min <= row_y_max + gap_tolerance:
                current_row.append(block)
                row_y_max = max(row_y_max, block[6])
            else:
                rows.append(current_row)
                current_row = [block]
                row_y_max   = block[6]

        rows.append(current_row)
        return rows

    # ═══════════════════════════════════════════════════════════════════════
    # Orphan-row merge  (FIX 2b — safety net)
    # ═══════════════════════════════════════════════════════════════════════

    _DECIMAL_RE = re.compile(r'\d+[.,]\d{1,2}')
    _NUMONLY_RE = re.compile(r'^[\d\s\t.,₹$%+\-]+$')

    def _merge_orphan_rows(self, rows: List[str]) -> List[str]:
        """
        Merge a text-only row with the immediately following numbers-only row.

        Handles the residual case where grouping puts the item name and its
        prices into separate rows:
          "Tandoori chicken"   +   "1\t295.00\t309.75"
          →  "Tandoori chicken\t1\t295.00\t309.75"
        """
        out, i = [], 0
        while i < len(rows):
            row = rows[i]
            if not self._DECIMAL_RE.search(row) and i + 1 < len(rows):
                nxt = rows[i + 1]
                if self._NUMONLY_RE.match(nxt.replace('\t', ' ')):
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
        r'\bTotal\b[^0-9₹$]*[₹$]?\s*([\d,]+\.?\d*)',
        re.IGNORECASE,
    )
    _TAX_SKIP_RE = re.compile(
        r'\b(sub.?total|cgst|sgst|igst|vat|s\.?tax|service.tax|discount)\b',
        re.IGNORECASE,
    )

    def _extract_total(self, flat: List[str]) -> Optional[float]:
        # Pass 1 — explicit "Total:" keyword; capture group = number after it
        for tok in flat:
            if self._TAX_SKIP_RE.search(tok):
                continue
            m = self._TOTAL_RE.search(tok)
            if m:
                try:
                    v = float(m.group(1).replace(',', ''))
                    if 0 < v < 10_000_000:
                        return v
                except ValueError:
                    pass

        # Pass 2 — largest plausible number on a non-header / non-tax line.
        # Skip date tokens (e.g. "2026-03-15") so the year is never mistaken
        # for a receipt total.  Pure standalone amounts (e.g. "14.66") are
        # still scanned — _is_date_or_amount returns True for those too, so
        # we check the date patterns specifically.
        _date_re = re.compile(
            r'\d{4}[/-]\d{1,2}[/-]\d{1,2}'
            r'|\d{1,2}[-/][A-Za-z]{3,9}[-/]\d{2,4}'
            r'|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}'
        )
        best: Optional[float] = None
        for tok in flat:
            if self._is_header_noise(tok) or self._TAX_SKIP_RE.search(tok):
                continue
            if _date_re.search(tok):          # skip tokens that contain a date
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
        items: List[ReceiptItemDTO] = []
        for row in rows:
            if self._should_skip_row(row):
                continue
            cols = [c.strip() for c in re.split(r'\t|  +', row) if c.strip()]
            if len(cols) < 2:
                continue
            cols = self._expand_merged_cols(cols)   # FIX 4
            item = self._parse_columns(cols)
            if item:
                logger.debug(
                    f"Item: {item.name!r} qty={item.quantity} "
                    f"unit={item.unitPrice} total={item.totalPrice}"
                )
                items.append(item)
        return items

    # ── FIX 4: expand merged number tokens ──────────────────────────────────

    _CLEAN_AMT = re.compile(r'^[\d,]+\.\d{1,2}$')
    _CLEAN_QTY = re.compile(r'^\d+(\.\d+)?$')
    _ALL_NUMS  = re.compile(r'^[\d,]+\.?\d*$')

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

        Walk right-to-left to find where the numeric section starts, then
        expand any merged tokens within that section.

        Previous bug: the loop used `else: break` and only recognised CLEAN
        single-number tokens; a space-separated token like "1 295.00 309.75"
        didn't match, so the loop broke early and the token was treated as
        part of the item name → _parse_columns returned None.
        """
        # Find split point between name cols and numeric cols
        split_idx = len(cols)
        for i in range(len(cols) - 1, -1, -1):
            if self._is_numeric_col(cols[i]):
                split_idx = i
            else:
                break   # first non-numeric from the right = name boundary

        name_cols   = cols[:split_idx]
        number_cols = cols[split_idx:]

        # Expand any merged tokens
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

        3+ numbers → qty, unit_price, total_price
        2  numbers → unit_price, total_price  (qty = 1)
        1  number  → total_price              (qty = 1, unit = total)
        """
        numeric, name_end = [], 0
        for i in range(len(cols) - 1, -1, -1):
            c = cols[i].replace(',', '')
            if self._CLEAN_AMT.match(c) or (self._CLEAN_QTY.match(c) and len(numeric) < 3):
                numeric.insert(0, c)
            else:
                name_end = i + 1
                break

        if not numeric:
            return None
        name = " ".join(cols[:name_end]).strip()
        if len(name) < 2:
            return None

        try:
            if len(numeric) >= 3:
                qty, unit, total = float(numeric[0]), float(numeric[1]), float(numeric[2])
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
                qty = 1.0
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

        # Tax / summary lines
        if re.search(
            r'\b(grand.?total|sub.?total|cgst|sgst|igst|vat|s\.?tax|service.tax'
            r'|service.charge|discount|surcharge|gratuity)\b', rl
        ):
            return True

        # Grand-total line  ("Total:  1139.00")
        if re.match(r'^\s*total[\s\t:₹$]+', rl):
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
            # Tax registration IDs
            r'\b(GSTIN|GSTR|PAN|VAT\s*No\.?|TIN|EIN|ABN)\b',
            # Invoice / bill reference headers
            r'\b(Invoice|Receipt|Bill|Order|Transaction)\s*(No\.?|Number|Date|ID|#)\b',
            # Phone / fax lines (generic)
            r'\b(Ph(one)?|Tel|Fax|Mobile|Mob)\.?\s*[:\.]?\s*\+?[\d\s\-()]{7,}',
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