#!/usr/bin/env bash
# Stage default model weights into apps/guanfu-desktop/resources/models for packaging.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DST="$ROOT/apps/guanfu-desktop/resources/models"
BASE_URL="${MODELS_BASE_URL:-https://raw.githubusercontent.com/upscayl/upscayl/main/resources/models}"

MODELS=(
  upscayl-standard-4x
  upscayl-lite-4x
  high-fidelity-4x
  remacri-4x
  ultramix-balanced-4x
  ultrasharp-4x
  digital-art-4x
)

mkdir -p "$DST"

download_one() {
  local name="$1"
  local ext="$2"
  local out="$DST/${name}.${ext}"
  if [[ -f "$out" && -s "$out" ]]; then
    echo "keep existing ${name}.${ext}"
    return 0
  fi
  echo "download ${name}.${ext}"
  curl -fsSL "${BASE_URL}/${name}.${ext}" -o "$out"
}

for m in "${MODELS[@]}"; do
  download_one "$m" param
  download_one "$m" bin
done

# Optional RestoreVAR models via secrets-backed env URLs
if [[ -n "${RESTOREVAR_PARAM_URL:-}" && -n "${RESTOREVAR_BIN_URL:-}" ]]; then
  echo "download restorevar models"
  curl -fsSL "$RESTOREVAR_PARAM_URL" -o "$DST/restorevar.param"
  curl -fsSL "$RESTOREVAR_BIN_URL" -o "$DST/restorevar.bin"
fi

echo "Staged models:"
ls -la "$DST"
