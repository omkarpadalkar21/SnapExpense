import logging
import os
import asyncio
import tempfile
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Dict

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from models import OCRRequest, OcrExtractedData, ErrorResponse, HealthResponse
from downloader import downloader
from ocr_service import ocr_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("Starting AI Service OCR...")
    yield
    logger.info("Shutting down AI Service OCR...")


# Create FastAPI application
app = FastAPI(
    title="AI Service OCR",
    description="FastAPI service for OCR processing of receipt images",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal server error",
            code="INTERNAL_ERROR",
            details={"message": str(exc)}
        ).dict()
    )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse()


@app.post("/ocr/extract", response_model=OcrExtractedData)
async def extract_ocr(request: OCRRequest):
    """
    Extract OCR data from receipt image using pre-signed URL
    
    Args:
        request: OCR request containing pre-signed URL
        
    Returns:
        OcrExtractedData: Structured receipt data with OCR results
    """
    temp_file_path = None
    
    try:
        logger.info(f"Processing OCR request for URL: {request.presigned_url}")
        
        # Download image from pre-signed URL
        temp_file_path = await downloader.download_from_presigned_url(
            str(request.presigned_url)
        )
        
        # Perform OCR processing
        paddleocr_result = ocr_service.extract_text_from_image(temp_file_path)
        
        # Parse receipt data
        receipt_data = ocr_service.parse_receipt_data(paddleocr_result)
        
        logger.info(f"OCR processing completed. Confidence: {receipt_data.ocrConfidence}")
        return receipt_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OCR processing failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=ErrorResponse(
                error=f"OCR processing failed: {str(e)}",
                code="OCR_PROCESSING_ERROR"
            ).dict()
        )
    finally:
        # Clean up temporary file
        if temp_file_path:
            downloader.cleanup_temp_file(temp_file_path)


@app.post("/ocr/extract/upload", response_model=OcrExtractedData)
async def extract_ocr_upload(file: UploadFile = File(...)):
    """
    Extract OCR data from a directly uploaded receipt image.

    Args:
        file: Uploaded image file (multipart/form-data)

    Returns:
        OcrExtractedData: Structured receipt data with OCR results
    """
    temp_file_path = None

    try:
        # Validate content type
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail=ErrorResponse(
                    error=f"Invalid file type '{file.content_type}'. Only image files are accepted.",
                    code="INVALID_FILE_TYPE"
                ).dict()
            )

        logger.info(f"Processing upload OCR request for file: {file.filename}")

        # Infer extension from original filename, fall back to .jpg
        suffix = Path(file.filename).suffix if file.filename and Path(file.filename).suffix else ".jpg"

        # Write uploaded bytes to a named temp file
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            temp_file_path = tmp.name
            tmp.write(await file.read())

        # Perform OCR processing
        paddleocr_result = ocr_service.extract_text_from_image(temp_file_path)

        # Parse receipt data
        receipt_data = ocr_service.parse_receipt_data(paddleocr_result)

        logger.info(
            f"OCR processing completed for '{file.filename}'. "
            f"Confidence: {receipt_data.ocrConfidence}"
        )
        return receipt_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OCR processing failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=ErrorResponse(
                error=f"OCR processing failed: {str(e)}",
                code="OCR_PROCESSING_ERROR"
            ).dict()
        )
    finally:
        # Clean up temporary file
        if temp_file_path:
            downloader.cleanup_temp_file(temp_file_path)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "AI Service OCR",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "ocr_extract": "/ocr/extract",
            "ocr_extract_upload": "/ocr/extract/upload",
            "docs": "/docs"
        }
    }


if __name__ == "__main__":
    import uvicorn
    
    # Configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    
    logger.info(f"Starting AI Service OCR on {host}:{port}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=False,  # Set to True for development
        log_level="info"
    )
