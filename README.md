# Guanfu

Guanfu is a desktop image restoration and enhancement client built as an AGPL-3.0 project.

This repository is organized as a clean monorepo:

- `apps/guanfu-desktop`: Electron desktop client based on the Upscayl project.
- `backends/upscayl-ncnn`: NCNN backend derived from upscayl-ncnn with RestoreVAR support.
- `models/restorevar`: model packaging notes.
- `docs`: architecture and compliance notes.

## Current Roadmap

Phase 1 focuses on a usable desktop release: rebrand the client, add a backend selector, wire RestoreVAR NCNN, and package a working build.

Phase 2 focuses on product cleanup: remove nonessential cloud/donation surfaces, refine Guanfu branding, and improve model management.


## Build

Build the native backend and update the desktop app binary:

```bash
scripts/build-backend.sh
```

Stage RestoreVAR model artifacts for local packaging:

```bash
scripts/stage-restorevar-models.sh /path/to/restorevar_models
```

Build a Linux x64 release package:

```bash
RESTOREVAR_MODEL_DIR=/path/to/restorevar_models scripts/package-linux-x64.sh
```
