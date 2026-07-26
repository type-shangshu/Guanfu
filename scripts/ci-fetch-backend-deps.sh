#!/usr/bin/env bash
# Fetch ncnn + libwebp into backends/upscayl-ncnn/src (not committed; required by CMake).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/backends/upscayl-ncnn/src"
NCNN_REF="${NCNN_REF:-b16501a65edf03828dae55b4d20ccc6a6bf4a3b4}"
LIBWEBP_REF="${LIBWEBP_REF:-v1.3.2}"

fetch_repo() {
  local dest="$1"
  local url="$2"
  local ref="$3"

  if [[ -f "$dest/CMakeLists.txt" ]]; then
    echo "keep existing $(basename "$dest") at $dest"
    if [[ -e "$dest/.git" ]]; then
      git -C "$dest" submodule update --init --recursive || true
    fi
    return 0
  fi

  rm -rf "$dest"
  echo "clone $url @ $ref -> $dest"
  git clone --filter=blob:none "$url" "$dest"
  git -C "$dest" fetch --depth 1 origin "$ref" 2>/dev/null \
    || git -C "$dest" fetch --depth 1 origin "+${ref}:refs/ci/ref" 2>/dev/null \
    || true
  if git -C "$dest" cat-file -e "$ref^{commit}" 2>/dev/null; then
    git -C "$dest" checkout --force "$ref"
  elif git -C "$dest" rev-parse --verify "refs/ci/ref" >/dev/null 2>&1; then
    git -C "$dest" checkout --force refs/ci/ref
  else
    # fall back to default branch tip
    echo "warning: ref $ref not found, using default branch" >&2
  fi
  git -C "$dest" submodule update --init --recursive
}

mkdir -p "$SRC"
fetch_repo "$SRC/ncnn" "https://github.com/Tencent/ncnn.git" "$NCNN_REF"
fetch_repo "$SRC/libwebp" "https://github.com/webmproject/libwebp.git" "$LIBWEBP_REF"

test -f "$SRC/ncnn/CMakeLists.txt"
test -f "$SRC/libwebp/CMakeLists.txt"
echo "backend deps ready"
