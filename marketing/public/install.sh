#!/bin/bash
# Vinexus macOS Installer
# Usage: /bin/bash -c "$(curl -fsSL https://vinexus.space/install.sh)"

set -e

REPO="apraba05/vinexus"
APP_NAME="Vinexus"
DMG_NAME="Vinexus-mac.dmg"
INSTALL_DIR="/Applications"
TMP_DMG="/tmp/Vinexus-install.dmg"
TMP_MOUNT="/tmp/Vinexus-dmg-mount"

echo ""
echo "  Vinexus Installer"
echo "  ─────────────────"
echo ""

# Check macOS
if [[ "$(uname)" != "Darwin" ]]; then
  echo "  This installer is for macOS only."
  exit 1
fi

# Clean up any previous partial install attempt
rm -f "$TMP_DMG"
hdiutil detach "$TMP_MOUNT" -quiet 2>/dev/null || true
rm -rf "$TMP_MOUNT"

echo "  Downloading Vinexus (~175 MB)..."
curl -fL --progress-bar \
  "https://github.com/${REPO}/releases/latest/download/${DMG_NAME}" \
  -o "$TMP_DMG"

echo "  Mounting disk image..."
mkdir -p "$TMP_MOUNT"
hdiutil attach "$TMP_DMG" -nobrowse -quiet -mountpoint "$TMP_MOUNT"

echo "  Installing to /Applications..."
# Quit any running Vinexus before replacing the app bundle
if pgrep -x "Vinexus" &>/dev/null; then
  echo "  Quitting running Vinexus..."
  osascript -e 'quit app "Vinexus"' 2>/dev/null || pkill -x "Vinexus" 2>/dev/null || true
  sleep 2
fi
if [ -d "${INSTALL_DIR}/${APP_NAME}.app" ]; then
  rm -rf "${INSTALL_DIR}/${APP_NAME}.app"
fi

if [ ! -d "${TMP_MOUNT}/${APP_NAME}.app" ]; then
  echo "  Error: ${APP_NAME}.app not found in disk image."
  hdiutil detach "$TMP_MOUNT" -quiet 2>/dev/null || true
  exit 1
fi

cp -R "${TMP_MOUNT}/${APP_NAME}.app" "${INSTALL_DIR}/"

echo "  Unmounting..."
hdiutil detach "$TMP_MOUNT" -quiet 2>/dev/null || true
rm -rf "$TMP_MOUNT"
rm -f "$TMP_DMG"

echo "  Removing macOS quarantine flag..."
xattr -cr "${INSTALL_DIR}/${APP_NAME}.app" 2>/dev/null || true

echo "  Applying ad-hoc code signature..."
# Must sign from innermost to outermost — helper .app bundles first,
# then frameworks/dylibs, then the outer app. This ensures macOS treats
# all Electron helper processes as part of the same app (no extra Dock icons).
find "${INSTALL_DIR}/${APP_NAME}.app/Contents/Frameworks" \
  -name "*.app" 2>/dev/null \
  | sort -r \
  | while read -r bundle; do
      codesign --force --sign - "$bundle" 2>/dev/null || true
    done
find "${INSTALL_DIR}/${APP_NAME}.app" \
  \( -name "*.dylib" -o -name "*.so" -o -name "*.node" \) 2>/dev/null \
  | sort -r \
  | xargs -I{} codesign --force --sign - {} 2>/dev/null || true
codesign --force --sign - "${INSTALL_DIR}/${APP_NAME}.app" 2>/dev/null || true

echo ""
echo "  Vinexus installed successfully!"
echo "  Launching..."
echo ""
open "${INSTALL_DIR}/${APP_NAME}.app"
