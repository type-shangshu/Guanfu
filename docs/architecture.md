# Architecture

Guanfu is a monorepo with a desktop client and a native NCNN backend.

## Desktop

`apps/guanfu-desktop` is an Electron/Next desktop app derived from Upscayl. It launches `upscayl-bin` and passes image paths, model paths, output scale, GPU id, and format options through command-line arguments.

The backend selector is stored in local settings. For Phase 1:

- `upscayl-ncnn` keeps the standard model flow.
- `restorevar-ncnn` overrides the model argument to `restorevar` and forces x4 scale.

## Backend

`backends/upscayl-ncnn` contains the NCNN backend source with RestoreVAR support. The desktop app packages the built binary as `resources/<platform>/bin/upscayl-bin`.

## Models

Runtime models are expected under `apps/guanfu-desktop/resources/models`. RestoreVAR requires `restorevar.param` and `restorevar.bin`.


## Custom Models

The desktop client accepts any custom model directory name. A model is detected only when both files are present with the same base name:

- `name.param`
- `name.bin`

Incomplete pairs are ignored and logged. The selected folder is passed to `upscayl-bin` through `-m`, and the selected model base name is passed through `-n`.
