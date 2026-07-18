# Notices

Guanfu includes modified software derived from Upscayl and upscayl-ncnn.

- Upscayl desktop client: AGPL-3.0, upstream project https://github.com/upscayl/upscayl
- upscayl-ncnn backend: AGPL-3.0, upstream project https://github.com/upscayl/upscayl-ncnn

Notable Guanfu changes include:

- Rebranded desktop application metadata to Guanfu.
- Added a desktop backend selector.
- Added RestoreVAR NCNN backend support through `-n restorevar`.
- Added Vulkan-capable RestoreVAR backend wiring in upscayl-ncnn.

RestoreVAR model weights and converted NCNN artifacts may have separate licensing terms. See `models/restorevar/README.md` before redistribution.
