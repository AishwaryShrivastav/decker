#!/usr/bin/env bash
# package-extension.sh - zip the Chrome extension for marketplace submission
# Usage: bash scripts/package-extension.sh [chrome]
set -euo pipefail

TARGET="${1:-chrome}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXT_DIR="$REPO_ROOT/apps/extension"

if [[ "$TARGET" != "chrome" ]]; then
  echo "Unsupported extension target: $TARGET. Decker v0.1.4 supports Chromium browsers only."
  exit 1
fi

SRC_DIR="$EXT_DIR/dist"
OUT_FILE="$REPO_ROOT/store-assets/decker-chrome.zip"

echo "Building Chrome extension..."
cd "$REPO_ROOT" && pnpm --filter extension build

if [[ ! -d "$SRC_DIR" ]]; then
  echo "Build output not found at $SRC_DIR"
  exit 1
fi

echo "Packaging $SRC_DIR to $OUT_FILE"
rm -f "$OUT_FILE"
cd "$SRC_DIR" && zip -r "$OUT_FILE" . -x "*.DS_Store" -x "__MACOSX/*"

echo "Done: $OUT_FILE"
echo "   Size: $(du -sh "$OUT_FILE" | cut -f1)"
