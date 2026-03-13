#!/bin/bash
# Extract all asset URLs from the codebase and generate download commands
# Usage: bash scripts/extract-assets.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ASSET_DIR="$PROJECT_ROOT/tmp-assets"

echo "🔍 Scanning codebase for assets.zhangjian94cn.top URLs..."
echo ""

# Extract unique URLs
URLS=$(grep -roh 'https://assets\.zhangjian94cn\.top/[^")*` ]*' \
  "$PROJECT_ROOT/content" "$PROJECT_ROOT/src" 2>/dev/null | \
  sort -u)

COUNT=$(echo "$URLS" | wc -l | tr -d ' ')
echo "📦 Found $COUNT unique asset URLs:"
echo ""
echo "$URLS"
echo ""

# Generate wget download script
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📥 To download all files to tmp-assets/, run:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "mkdir -p '$ASSET_DIR'"
echo ""

echo "$URLS" | while read -r url; do
  # Extract path after domain: images/blog/xxx/yyy.png
  rel_path="${url#https://assets.zhangjian94cn.top/}"
  dir_path="$(dirname "$rel_path")"
  echo "mkdir -p '$ASSET_DIR/$dir_path' && wget -q -O '$ASSET_DIR/$rel_path' '$url'"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Copy & run the commands above, or pipe this script:"
echo "   bash scripts/extract-assets.sh | grep 'wget' | bash"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
