#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND="$ROOT/backends/upscayl-ncnn"
BUILD="$BACKEND/build-guanfu"
APP_BIN="$ROOT/apps/guanfu-desktop/resources/linux-x64/bin"

cmake -S "$BACKEND/src" -B "$BUILD" \
  -DNCNN_VULKAN=ON \
  -DNCNN_VULKAN_ONLINE_SPIRV=ON \
  -DNCNN_ENABLE_LTO=OFF \
  -DCMAKE_BUILD_TYPE=Release
cmake --build "$BUILD" --target upscayl-bin -j"${JOBS:-$(nproc)}"

mkdir -p "$APP_BIN"
cp "$BUILD/upscayl-bin" "$APP_BIN/upscayl-bin"
chmod 755 "$APP_BIN/upscayl-bin"
echo "Updated $APP_BIN/upscayl-bin"
