import os
import tempfile
import httpx
from typing import Optional
from urllib.parse import urlparse
import logging

logger = logging.getLogger(__name__)


class MultipartDownloader:
    """Handles chunked downloads using HTTP Range headers for large files"""
    
    def __init__(self, chunk_size: int = 1024 * 1024):  # 1MB chunks
        self.chunk_size = chunk_size
        self.timeout = httpx.Timeout(30.0, connect=10.0)
    
    async def download_from_presigned_url(self, presigned_url: str) -> str:
        """
        Download file from AWS S3 pre-signed URL using HTTP Range headers
        
        Args:
            presigned_url: AWS S3 pre-signed URL
            
        Returns:
            str: Path to downloaded temporary file
            
        Raises:
            Exception: If download fails
        """
        try:
            # Parse URL to get file extension
            parsed_url = urlparse(presigned_url)
            file_extension = os.path.splitext(parsed_url.path)[1] or '.tmp'
            
            # Create temporary file
            temp_file = tempfile.NamedTemporaryFile(
                suffix=file_extension,
                delete=False
            )
            temp_path = temp_file.name
            temp_file.close()
            
            # Get file size first
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                head_response = await client.head(presigned_url)
                head_response.raise_for_status()
                
                content_length = head_response.headers.get('content-length')
                if not content_length:
                    # If no content-length, download as single chunk
                    return await self._download_single_chunk(presigned_url, temp_path)
                
                file_size = int(content_length)
                logger.info(f"Downloading file of size: {file_size} bytes")
            
            # Download in chunks using Range headers
            await self._download_chunks(presigned_url, temp_path, file_size)
            
            logger.info(f"Successfully downloaded file to: {temp_path}")
            return temp_path
            
        except Exception as e:
            # Clean up temp file on error
            if 'temp_path' in locals() and os.path.exists(temp_path):
                os.unlink(temp_path)
            logger.error(f"Download failed: {str(e)}")
            raise Exception(f"Failed to download file: {str(e)}")
    
    async def _download_single_chunk(self, url: str, temp_path: str) -> str:
        """Download entire file in single request (fallback method)"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(url)
            response.raise_for_status()
            
            with open(temp_path, 'wb') as f:
                f.write(response.content)
            
            return temp_path
    
    async def _download_chunks(self, url: str, temp_path: str, file_size: int) -> None:
        """Download file in chunks using HTTP Range headers"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            with open(temp_path, 'wb') as f:
                start_byte = 0
                
                while start_byte < file_size:
                    end_byte = min(start_byte + self.chunk_size - 1, file_size - 1)
                    range_header = f"bytes={start_byte}-{end_byte}"
                    
                    response = await client.get(
                        url,
                        headers={"Range": range_header}
                    )
                    response.raise_for_status()
                    
                    f.write(response.content)
                    
                    # Log progress for large files
                    if file_size > 10 * 1024 * 1024:  # 10MB+
                        progress = (start_byte / file_size) * 100
                        logger.info(f"Download progress: {progress:.1f}%")
                    
                    start_byte = end_byte + 1
    
    def cleanup_temp_file(self, file_path: str) -> None:
        """Clean up temporary file"""
        try:
            if os.path.exists(file_path):
                os.unlink(file_path)
                logger.info(f"Cleaned up temporary file: {file_path}")
        except Exception as e:
            logger.warning(f"Failed to cleanup temp file {file_path}: {str(e)}")


# Singleton instance
downloader = MultipartDownloader()
