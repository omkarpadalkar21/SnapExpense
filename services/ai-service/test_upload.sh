#!/usr/bin/env bash
# =============================================================================
# test_upload.sh — Test the POST /ocr/extract/upload endpoint
#
# What it does:
#   Sends a local image file to the AI Service OCR upload endpoint using curl
#   and pretty-prints the JSON response.
#
# How to change the image path:
#   Set IMAGE_PATH below to the absolute or relative path of your receipt image.
#   Example: IMAGE_PATH="/home/user/receipts/receipt.jpg"
#
# How to change the host:
#   Set HOST below if the service runs on a different address or port.
#   Example: HOST="http://localhost:9000"
# =============================================================================

# ---------------------------------------------------------------------------
# USER CONFIGURATION — edit these two variables before running
# ---------------------------------------------------------------------------
IMAGE_PATH="../../client/public/restaurant_receipt9.png"
HOST="http://localhost:8000"
# ---------------------------------------------------------------------------

ENDPOINT="${HOST}/ocr/extract/upload"

echo "-------------------------------------------"
echo "  AI Service OCR — Upload Test"
echo "-------------------------------------------"
echo "  File : ${IMAGE_PATH}"
echo "  URL  : ${ENDPOINT}"
echo "-------------------------------------------"
echo ""

# Validate IMAGE_PATH is set
if [ -z "${IMAGE_PATH}" ]; then
    echo "ERROR: IMAGE_PATH is not set. Edit the variable at the top of this script."
    exit 1
fi

# Validate the file exists
if [ ! -f "${IMAGE_PATH}" ]; then
    echo "ERROR: File not found: ${IMAGE_PATH}"
    echo "       Update IMAGE_PATH at the top of this script to point to a valid image file."
    exit 1
fi

# Send the request and capture both the body and the HTTP status code
RESPONSE=$(
    curl -s \
        -w "\nHTTP Status: %{http_code}\n" \
        -F "file=@${IMAGE_PATH}" \
        "${ENDPOINT}"
)

# Split body from the "HTTP Status: NNN" trailer
HTTP_STATUS=$(echo "${RESPONSE}" | grep "^HTTP Status:" | awk '{print $3}')
BODY=$(echo "${RESPONSE}" | grep -v "^HTTP Status:")

echo "Response:"
# Pretty-print JSON if python3 is available; fall back to raw output
if command -v python3 &>/dev/null; then
    echo "${BODY}" | python3 -m json.tool 2>/dev/null || echo "${BODY}"
else
    echo "${BODY}"
fi

echo ""
echo "HTTP Status: ${HTTP_STATUS}"
echo ""

# Summary
if [ "${HTTP_STATUS}" = "200" ]; then
    echo "✅ Success — OCR extraction completed."
else
    echo "❌ Error — request failed with HTTP ${HTTP_STATUS}."
fi
