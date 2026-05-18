#!/usr/bin/env bash
# Copy release APK into public/ so the home page can offer /EMS.apk for download.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/releases/EMS.apk"
DEST="$ROOT/public/EMS.apk"

if [[ ! -f "$SRC" ]]; then
  echo "No releases/EMS.apk — run npm run build:ems:apk first (optional for web-only builds)." >&2
  exit 0
fi

mkdir -p "$ROOT/public"
cp "$SRC" "$DEST"
echo "APK ready for download at /EMS.apk"
