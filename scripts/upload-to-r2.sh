#!/bin/bash
# Upload all files from tmp-assets to R2 bucket
# Usage: bash scripts/upload-to-r2.sh

set -e

BUCKET_NAME="personal-site-assets"
ASSET_DIR="$(cd "$(dirname "$0")/.." && pwd)/tmp-assets"

if [ ! -d "$ASSET_DIR" ]; then
  echo "❌ tmp-assets/ not found. Run extract-assets.sh first."
  exit 1
fi

echo "🚀 Uploading assets to R2 bucket: $BUCKET_NAME"
echo ""

SUCCESS=0
FAIL=0

while IFS= read -r file; do
  rel_path="${file#$ASSET_DIR/}"
  
  # Determine content type
  case "$file" in
    *.png)  ct="image/png" ;;
    *.jpg)  ct="image/jpeg" ;;
    *.jpeg) ct="image/jpeg" ;;
    *.gif)  ct="image/gif" ;;
    *.webp) ct="image/webp" ;;
    *.svg)  ct="image/svg+xml" ;;
    *.zip)  ct="application/zip" ;;
    *.pdf)  ct="application/pdf" ;;
    *)      ct="application/octet-stream" ;;
  esac
  
  echo "📤 [$ct] $rel_path"
  if wrangler r2 object put "$BUCKET_NAME/$rel_path" --file="$file" --content-type="$ct" --remote 2>/dev/null; then
    echo "   ✅ OK"
    ((SUCCESS++)) || true
  else
    echo "   ❌ FAILED"
    ((FAIL++)) || true
  fi
done < <(find "$ASSET_DIR" -type f | sort)

echo ""
echo "✅ Upload complete! Success: $SUCCESS, Failed: $FAIL"

