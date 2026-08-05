#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/models/restorevar"
DST="$ROOT/apps/guanfu-desktop/resources/models"

mkdir -p "$DST"
cp -L "$SRC/restorevar.param" "$DST/restorevar.param"
cp -L "$SRC/restorevar.bin" "$DST/restorevar.bin"

echo "Staged RestoreVAR model files into $DST"
