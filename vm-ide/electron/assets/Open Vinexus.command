#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  Vinexus — First Launch Helper
#
#  macOS blocks apps downloaded from the internet until Apple
#  verifies them (requires a paid Developer account we don't
#  have yet). This script removes that block so Vinexus can run.
#
#  You only need to run this ONCE after installing.
# ─────────────────────────────────────────────────────────────

APP="/Applications/Vinexus.app"

echo ""
echo "  Vinexus — First Launch Helper"
echo "  ─────────────────────────────"
echo ""

if [ ! -d "$APP" ]; then
  echo "  ✗  Vinexus.app was not found in /Applications."
  echo ""
  echo "  Please drag Vinexus to your Applications folder first,"
  echo "  then double-click this file again."
  echo ""
  read -r -p "  Press Enter to close..."
  exit 1
fi

echo "  Removing macOS security restriction..."
xattr -cr "$APP" 2>/dev/null

echo "  Done! Opening Vinexus..."
echo ""
open "$APP"
