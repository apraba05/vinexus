#!/bin/bash
# Vinexus macOS Installer
# Usage: /bin/bash -c "$(curl -fsSL https://vinexus.space/install.sh)"

set -e

REPO="apraba05/vinexus"
APP_NAME="Vinexus"
DMG_NAME="Vinexus-mac.dmg"
INSTALL_DIR="/Applications"
TMP_DMG="/tmp/Vinexus-install.dmg"

echo ""
echo "  Vinexus Installer"
echo "  ─────────────────"
echo ""

# Check macOS
if [[ "$(uname)" != "Darwin" ]]; then
  echo "  This installer is for macOS only."
  exit 1
fi

echo "  Downloading Vinexus..."
curl -fsSL "https://github.com/${REPO}/releases/latest/download/${DMG_NAME}" -o "$TMP_DMG"

echo "  Mounting disk image..."
MOUNT_POINT=$(hdiutil attach "$TMP_DMG" -nobrowse -quiet | tail -1 | awk '{print $NF}')

echo "  Installing to /Applications..."
if [ -d "${INSTALL_DIR}/${APP_NAME}.app" ]; then
  rm -rf "${INSTALL_DIR}/${APP_NAME}.app"
fi
cp -R "${MOUNT_POINT}/${APP_NAME}.app" "${INSTALL_DIR}/"

echo "  Unmounting..."
hdiutil detach "$MOUNT_POINT" -quiet
rm -f "$TMP_DMG"

echo "  Removing macOS security restriction..."
xattr -cr "${INSTALL_DIR}/${APP_NAME}.app" 2>/dev/null || true

echo "  Applying signature..."
codesign --force --deep --sign - "${INSTALL_DIR}/${APP_NAME}.app" 2>/dev/null || true

echo ""
echo "  Vinexus installed successfully!"
echo "  Launching..."
echo ""
open "${INSTALL_DIR}/${APP_NAME}.app"
