#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP="$ROOT/apps/guanfu-desktop"
MODEL_SRC="${RESTOREVAR_MODEL_DIR:-/home/ljw/RestoreVAR/artifacts/restorevar_models}"

"$ROOT/scripts/build-backend.sh"
"$ROOT/scripts/stage-restorevar-models.sh" "$MODEL_SRC"

cd "$APP"
npm install
npm run dist:linux-x64
