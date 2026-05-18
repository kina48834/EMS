#!/usr/bin/env bash
# Keep a single release APK at releases/EMS.apk (Expo native Android).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILT="$ROOT/mobile/android/app/build/outputs/apk/release/app-release.apk"
OUT="$ROOT/releases/EMS.apk"

if [[ ! -f "$BUILT" ]]; then
  echo "Missing build output: $BUILT" >&2
  exit 1
fi

mkdir -p "$ROOT/releases"
cp "$BUILT" "$OUT"
while IFS= read -r -d '' f; do
  [[ "$f" == "$OUT" ]] && continue
  rm -f "$f"
done < <(find "$ROOT" -name "*.apk" -print0)

mkdir -p "$ROOT/public"
cp "$OUT" "$ROOT/public/EMS.apk"
echo "Release APK: $OUT ($(du -h "$OUT" | cut -f1))"
echo "Web download: $ROOT/public/EMS.apk"
