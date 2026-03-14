import re
import logging
from datetime import datetime
from typing import List, Dict, Optional
from paddleocr import PaddleOCR
from models import OcrExtractedData, ReceiptItemDTO

logger = logging.getLogger(__name__)


class OCRService:
    """PaddleOCR integration service with receipt parsing logic"""
    
    def __init__(self):
        # Initialize PaddleOCR with English language support
        self.ocr = PaddleOCR(use_angle_cls=True, lang='en')
    
    def extract_text_from_image(self, image_path: str) -> List[List]:
        """
        Extract text from image using PaddleOCR
        
        Args:
            image_path: Path to the image file
            
        Returns:
            List[List]: Raw PaddleOCR output structure
        """
        try:
            result = self.ocr.ocr(image_path, cls=True)
            
            # Handle empty results
            if not result or not result[0]:
                logger.warning("No text detected in image")
                return [[]]
            
            return result
            
        except Exception as e:
            logger.error(f"PaddleOCR processing failed: {str(e)}")
            raise Exception(f"OCR processing failed: {str(e)}")
    
    def parse_receipt_data(self, paddleocr_result: List[List]) -> OcrExtractedData:
        """
        Transform PaddleOCR raw output to structured receipt data
        
        Args:
            paddleocr_result: Raw output from PaddleOCR
            
        Returns:
            OcrExtractedData: Structured receipt data
        """
        try:
            # Handle empty OCR results
            if not paddleocr_result or not paddleocr_result[0]:
                return self._create_empty_receipt_data()
            
            # Extract all text and confidences
            all_lines = []
            confidences = []
            
            for line in paddleocr_result[0]:
                if line and len(line) >= 2:
                    text = line[1][0].strip()
                    confidence = line[1][1]
                    all_lines.append(text)
                    confidences.append(confidence)
            
            if not all_lines:
                return self._create_empty_receipt_data()
            
            all_text = " ".join(all_lines)
            
            # Extract receipt components
            merchant = self._extract_merchant(all_lines)
            total_amount = self._extract_amount(all_lines, is_total=True)
            receipt_date = self._extract_date(all_lines)
            items = self._extract_items(all_lines, total_amount)
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
            
            return OcrExtractedData(
                merchantName=merchant,
                totalAmount=float(total_amount) if total_amount else 0.0,
                receiptDate=receipt_date,
                items=items,
                ocrRawText=all_text,
                ocrConfidence=round(avg_confidence, 3)
            )
            
        except Exception as e:
            logger.error(f"Failed to parse receipt data: {str(e)}")
            return self._create_empty_receipt_data()
    
    def _create_empty_receipt_data(self) -> OcrExtractedData:
        """Create empty receipt data for error cases"""
        return OcrExtractedData(
            merchantName="",
            totalAmount=0.0,
            receiptDate=None,
            items=[],
            ocrRawText="",
            ocrConfidence=0.0
        )
    
    def _extract_merchant(self, lines: List[str]) -> str:
        """Extract merchant name (usually first non-empty line)"""
        for line in lines:
            if line.strip() and not self._is_date_or_amount(line):
                return line.strip()
        return ""
    
    def _extract_amount(self, lines: List[str], is_total: bool = False) -> Optional[float]:
        """
        Extract amount using regex. Prioritize 'Total:' for total amount
        
        Args:
            lines: List of text lines
            is_total: Whether to look for total amount specifically
            
        Returns:
            Optional[float]: Extracted amount or None
        """
        if is_total:
            # Look for "Total:" pattern first
            total_pattern = r'Total[:\s]*[₹$]?([\d,]+\.?\d*)'
            for line in lines:
                if re.search(total_pattern, line, re.IGNORECASE):
                    match = re.search(r'[\d,]+\.?\d*', line)
                    if match:
                        return float(match.group().replace(',', ''))
        
        # Fallback: extract all amounts and return largest for total
        amounts = []
        for line in lines:
            # Match currency amounts (₹ or $ symbol optional)
            matches = re.findall(r'[₹$]?([\d,]+\.?\d*)', line)
            for match in matches:
                try:
                    amount = float(match.replace(',', ''))
                    if amount > 0:  # Only consider positive amounts
                        amounts.append(amount)
                except ValueError:
                    continue
        
        if not amounts:
            return None
        
        return max(amounts) if is_total else amounts[0]
    
    def _extract_date(self, lines: List[str]) -> Optional[str]:
        """Extract date from receipt"""
        date_patterns = [
            r'(\d{1,2}[/-]\s*[A-Za-z]{3,9}[/-]\s*\d{4})',  # 03 Mar 2026, 03/Mar/2026
            r'(\d{1,2}[/-]\d{1,2}[/-]\d{4})',              # 03/03/2026, 03-03-2026
            r'(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})',          # 03 Mar 2026
            r'(\d{4}[/-]\d{1,2}[/-]\d{1,2})',              # 2026/03/03
        ]
        
        for line in lines:
            for pattern in date_patterns:
                match = re.search(pattern, line)
                if match:
                    date_str = match.group(1)
                    # Try to normalize to YYYY-MM-DD format
                    return self._normalize_date(date_str)
        
        return None
    
    def _normalize_date(self, date_str: str) -> str:
        """Normalize various date formats to YYYY-MM-DD"""
        try:
            # Try different date formats
            formats = [
                '%d %b %Y',    # 03 Mar 2026
                '%d-%b-%Y',    # 03-Mar-2026
                '%d/%b/%Y',    # 03/Mar/2026
                '%d-%m-%Y',    # 03-03-2026
                '%d/%m/%Y',    # 03/03/2026
                '%Y-%m-%d',    # 2026-03-03
                '%Y/%m/%d',    # 2026/03/03
            ]
            
            for fmt in formats:
                try:
                    dt = datetime.strptime(date_str, fmt)
                    return dt.strftime('%Y-%m-%d')
                except ValueError:
                    continue
            
            return date_str  # Return original if parsing fails
        except:
            return date_str
    
    def _extract_items(self, lines: List[str], total_amount: Optional[float]) -> List[ReceiptItemDTO]:
        """Extract individual items and their prices"""
        items = []
        
        for line in lines:
            # Skip lines that are likely merchant, total, or date
            if self._should_skip_line(line, total_amount):
                continue
            
            # Match item name + price pattern
            # Pattern: item description followed by price
            item_match = re.match(r'(.+?)\s+[₹$]?([\d,]+\.?\d*)\s*$', line.strip())
            if item_match:
                name = item_match.group(1).strip()
                price_str = item_match.group(2)
                
                try:
                    price = float(price_str.replace(',', ''))
                    
                    # Skip if price seems unrealistic (too high or too low)
                    if price <= 0 or price > 100000:  # Reasonable limits
                        continue
                    
                    items.append(ReceiptItemDTO(
                        name=name,
                        quantity=1.0,
                        unitPrice=price,
                        totalPrice=price
                    ))
                except ValueError:
                    continue
        
        return items
    
    def _should_skip_line(self, line: str, total_amount: Optional[float]) -> bool:
        """Determine if a line should be skipped during item extraction"""
        line_lower = line.lower().strip()
        
        # Skip if contains total indicators
        if any(keyword in line_lower for keyword in ['total', 'subtotal', 'tax', 'amount']):
            return True
        
        # Skip if looks like a date
        if self._is_date_or_amount(line):
            return True
        
        # Skip if line is too short or too long
        if len(line.strip()) < 3 or len(line.strip()) > 100:
            return True
        
        # Skip if contains only numbers or symbols
        if re.match(r'^[0-9\s₹$.,-]+$', line):
            return True
        
        return False
    
    def _is_date_or_amount(self, line: str) -> bool:
        """Check if line looks like a date or pure amount"""
        # Date patterns
        date_patterns = [
            r'\d{1,2}[/-]\d{1,2}[/-]\d{4}',
            r'\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}',
            r'\d{4}[/-]\d{1,2}[/-]\d{1,2}',
        ]
        
        for pattern in date_patterns:
            if re.search(pattern, line):
                return True
        
        # Pure amount patterns
        if re.match(r'^[₹$]?\s*[\d,]+\.?\d*\s*$', line.strip()):
            return True
        
        return False


# Singleton instance
ocr_service = OCRService()
