import os
import tempfile
import httpx
from urllib.parse import urlparse
import logging

logger = logging.getLogger(__name__)


class MultipartDownloader:
    """Downloads files from pre-signed S3/R2 URLs"""

    def __init__(self):
        self.timeout = httpx.Timeout(60.0, connect=10.0)

    async def download_from_presigned_url(self, presigned_url: str) -> str:
        """
        Download file from a pre-signed S3/R2 URL.

        Pre-signed URLs are signed for a specific set of headers (typically only 'host').
        Adding ANY extra headers (e.g. Range, Content-Type) invalidates the signature
        and causes a 403 Forbidden. Always use a plain GET with no extra headers.

        Args:
            presigned_url: Pre-signed URL (AWS S3 or Cloudflare R2)

        Returns:
            str: Path to downloaded temporary file

        Raises:
            Exception: If download fails
        """
        parsed_url = urlparse(presigned_url)
        file_extension = os.path.splitext(parsed_url.path)[1] or '.jpg'

        temp_file = tempfile.NamedTemporaryFile(suffix=file_extension, delete=False)
        temp_path = temp_file.name
        temp_file.close()

        try:
            async with httpx.AsyncClient(timeout=self.timeout, verify=False) as client:
                # Plain GET — do NOT add any headers; the URL is already signed for 'host' only
                response = await client.get(presigned_url)
                response.raise_for_status()

                with open(temp_path, 'wb') as f:
                    f.write(response.content)

            logger.info(f"Downloaded {len(response.content)} bytes to {temp_path}")
            return temp_path

        except Exception as e:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
            logger.error(f"Download failed: {str(e)}")
            raise Exception(f"Failed to download file: {str(e)}")

    def cleanup_temp_file(self, file_path: str) -> None:
        """Remove temporary file"""
        try:
            if os.path.exists(file_path):
                os.unlink(file_path)
                logger.info(f"Cleaned up: {file_path}")
        except Exception as e:
            logger.warning(f"Failed to cleanup {file_path}: {str(e)}")


# Singleton instance
downloader = MultipartDownloader()