#!/usr/bin/env bash
# Native Expo/React Native release APK (online Supabase — uses mobile/.env at bundle time).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE="$ROOT/mobile"
OUT="$ROOT/releases/EMS.apk"
CACHE_JDK="$ROOT/.cache/ems-jdk17"
export ANDROID_HOME="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"
export CI=1

if [[ ! -f "$MOBILE/.env" ]]; then
  echo "Missing mobile/.env (EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY)" >&2
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
  echo "→ Downloading JDK 17 for Android build (Gradle does not support Java 25)…"
  mkdir -p "$ROOT/.cache"
  local arch="aarch64"
  [[ "$(uname -m)" == "x86_64" ]] && arch="x64"
  local url="https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.13%2B11/OpenJDK17U-jdk_${arch}_mac_hotspot_17.0.13_11.tar.gz"
  curl -fsSL "$url" -o "$ROOT/.cache/jdk17.tar.gz"
  rm -rf "$CACHE_JDK"
  mkdir -p "$CACHE_JDK"
  tar -xzf "$ROOT/.cache/jdk17.tar.gz" -C "$CACHE_JDK" --strip-components=1
  export JAVA_HOME="$CACHE_JDK/Contents/Home"
  echo "Using JAVA_HOME=$JAVA_HOME"
}

ensure_java17

echo "→ Embedding Supabase env for release bundle…"
node "$ROOT/scripts/generate-mobile-env.mjs"

if [[ -f "$MOBILE/.env" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$MOBILE/.env"
  set +a
  export EXPO_PUBLIC_SUPABASE_URL EXPO_PUBLIC_SUPABASE_ANON_KEY
fi

echo "→ Installing mobile dependencies…"
(cd "$MOBILE" && npm install && npx expo install --fix)

echo "→ Expo prebuild (Android native project)…"
(cd "$MOBILE" && npx expo prebuild --platform android --clean)

echo "→ Gradle assembleRelease…"
(cd "$MOBILE/android" && chmod +x gradlew && ./gradlew assembleRelease --no-daemon)

BUILT="$MOBILE/android/app/build/outputs/apk/release/app-release.apk"
if [[ ! -f "$BUILT" ]]; then
  BUILT="$MOBILE/android/app/build/outputs/apk/release/app-release-unsigned.apk"
fi
if [[ ! -f "$BUILT" ]]; then
  echo "APK not found under mobile/android/app/build/outputs/apk/release/" >&2
  ls -la "$MOBILE/android/app/build/outputs/apk/release/" 2>/dev/null || true
  exit 1
fi

bash "$ROOT/scripts/finalize-apk.sh"
