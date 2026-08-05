# Guanfu

Guanfu is a desktop image restoration and enhancement client built as an AGPL-3.0 project.

This repository is organized as a clean monorepo:

- `apps/guanfu-desktop`: Electron desktop client based on the [Upscayl](https://github.com/upscayl/upscayl) project.
- `backends/upscayl-ncnn`: NCNN backend derived from [upscayl-ncnn](https://github.com/upscayl/upscayl-ncnn) with RestoreVAR support.
- `models/restorevar`: model downloading and packaging notes.
- `docs`: architecture and compliance notes.

## Current Roadmap

Phase 1 focuses on a usable desktop release: rebrand the client, add a backend selector, wire RestoreVAR NCNN, and package a working build.

Phase 2 focuses on product cleanup: remove nonessential cloud/donation surfaces, refine Guanfu branding, and improve model management.


## Build

Build the native backend and update the desktop app binary:

```bash
scripts/build-backend.sh
```

Download RestoreVAR-NCNN model (`restorevar.bin` and `restorevar.param`) from https://modelscope.cn/models/nju9xh/RestoreVAR-ncnn and put them in `models/restorevar`. 

Build a Linux x64 release package:

```bash
RESTOREVAR_MODEL_DIR=/path/to/restorevar_models scripts/package-linux-x64.sh
```
