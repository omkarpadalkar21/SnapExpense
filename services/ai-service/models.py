from typing import List, Optional
from pydantic import BaseModel, Field, HttpUrl


class OCRRequest(BaseModel):
    """Request model for OCR extraction with pre-signed URL"""
    presigned_url: HttpUrl = Field(..., description="AWS S3 pre-signed URL for the receipt image")


class ReceiptItemDTO(BaseModel):
    """Individual receipt item structure matching Spring Boot DTO"""
    name: str = Field(..., description="Item name/description")
    quantity: float = Field(default=1.0, description="Item quantity")
    unitPrice: float = Field(..., description="Price per unit")
    totalPrice: float = Field(..., description="Total price for this item")


class OcrExtractedData(BaseModel):
    """Main OCR response structure matching Spring Boot OcrExtractedData DTO"""
    merchantName: str = Field(default="", description="Extracted merchant/store name")
    totalAmount: float = Field(default=0.0, description="Total amount from receipt")
    receiptDate: Optional[str] = Field(default=None, description="Receipt date in YYYY-MM-DD format")
    items: List[ReceiptItemDTO] = Field(default_factory=list, description="List of extracted receipt items")
    ocrRawText: str = Field(default="", description="Complete raw OCR text")
    ocrConfidence: float = Field(default=0.0, description="Average confidence score across all detected text")


class ErrorResponse(BaseModel):
    """Standardized error response structure"""
    error: str = Field(..., description="Error message")
    code: str = Field(default="OCR_ERROR", description="Error code")
    details: Optional[dict] = Field(default=None, description="Additional error details")


class HealthResponse(BaseModel):
    """Health check response"""
    status: str = Field(default="healthy", description="Service health status")
    service: str = Field(default="ai-service", description="Service name")
    version: str = Field(default="1.0.0", description="Service version")
