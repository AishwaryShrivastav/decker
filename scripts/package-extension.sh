#!/usr/bin/env bash
# package-extension.sh — zip the built extension for marketplace submission
# Usage: bash scripts/package-extension.sh [chrome|firefox]
set -euo pipefail

TARGET="${1:-chrome}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXT_DIR="$REPO_ROOT/apps/extension"

if [[ "$TARGET" == "firefox" ]]; then
  SRC_DIR="$EXT_DIR/dist-firefox"
  OUT_FILE="$REPO_ROOT/decker-firefox.zip"
  BUILD_CMD="pnpm --filter extension build:firefox"
else
  SRC_DIR="$EXT_DIR/dist"
  OUT_FILE="$REPO_ROOT/decker-chrome.zip"
  BUILD_CMD="pnpm --filter extension build"
fi

echo "→ Building $TARGET extension…"
cd "$REPO_ROOT" && eval "$BUILD_CMD"

if [[ ! -d "$SRC_DIR" ]]; then
  echo "❌ Build output not found at $SRC_DIR"
  exit 1
fi

echo "→ Packaging $SRC_DIR → $OUT_FILE"
rm -f "$OUT_FILE"
cd "$SRC_DIR" && zip -r "$OUT_FILE" . -x "*.DS_Store" -x "__MACOSX/*"

echo "✅ Done: $OUT_FILE"
echo "   Size: $(du -sh "$OUT_FILE" | cut -f1)"
