#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="${1:-/home/ljw/RestoreVAR/artifacts/restorevar_models}"
DST="$ROOT/apps/guanfu-desktop/resources/models"

mkdir -p "$DST"
cp -L "$SRC/restorevar.param" "$DST/restorevar.param"
cp -L "$SRC/restorevar.bin" "$DST/restorevar.bin"

echo "Staged RestoreVAR model files into $DST"
