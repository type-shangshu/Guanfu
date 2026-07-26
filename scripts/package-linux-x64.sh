#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP="$ROOT/apps/guanfu-desktop"

"$ROOT/scripts/build-backend.sh"
"$ROOT/scripts/build-desktop.sh"

cd "$APP"
CSC_IDENTITY_AUTO_DISCOVERY=false npx electron-builder --linux AppImage --x64
echo "Artifacts:"
ls -la "$APP/dist"/*AppImage 2>/dev/null || true
