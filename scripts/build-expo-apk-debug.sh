#!/usr/bin/env bash
# Expo debug APK (install for testing; connects to Supabase via mobile/.env).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE="$ROOT/mobile"
OUT="$ROOT/releases/EMS-debug.apk"
CACHE_JDK="$ROOT/.cache/ems-jdk17"
export ANDROID_HOME="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android.sdk}}"
export CI=1

if [[ ! -f "$MOBILE/.env" ]]; then
  echo "Missing mobile/.env" >&2
  exit 1
fi

ensure_java17() {
  if [[ -n "${JAVA_HOME:-}" ]] && "$JAVA_HOME/bin/java" -version 2>&1 | grep -q 'version "17'; then
    return
  fi
  if [[ -x "$CACHE_JDK/Contents/Home/bin/java" ]]; then
    export JAVA_HOME="$CACHE_JDK/Contents/Home"
    return
  fi
  echo "→ Downloading JDK 17…"
  mkdir -p "$ROOT/.cache"
  local arch="aarch64"
  [[ "$(uname -m)" == "x86_64" ]] && arch="x64"
  curl -fsSL "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.13%2B11/OpenJDK17U-jdk_${arch}_mac_hotspot_17.0.13_11.tar.gz" \
    -o "$ROOT/.cache/jdk17.tar.gz"
  rm -rf "$CACHE_JDK"
  mkdir -p "$CACHE_JDK"
  tar -xzf "$ROOT/.cache/jdk17.tar.gz" -C "$CACHE_JDK" --strip-components=1
  export JAVA_HOME="$CACHE_JDK/Contents/Home"
}

ensure_java17

(cd "$MOBILE" && npm install && npx expo install --fix)
(cd "$MOBILE" && npx expo prebuild --platform android --clean)
(cd "$MOBILE/android" && chmod +x gradlew && ./gradlew assembleDebug --no-daemon)

BUILT="$MOBILE/android/app/build/outputs/apk/debug/app-debug.apk"
[[ -f "$BUILT" ]] || { echo "Debug APK not found" >&2; exit 1; }

mkdir -p "$ROOT/releases"
cp "$BUILT" "$OUT"
echo "Debug APK: $OUT ($(du -h "$OUT" | cut -f1))"
