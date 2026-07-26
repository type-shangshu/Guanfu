#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP="$ROOT/apps/guanfu-desktop"

cd "$APP"
if [ ! -d node_modules ]; then
  npm install
fi
npm run build
