# RestoreVAR Model Files

The desktop app expects these NCNN artifacts at runtime:

- `restorevar.param`
- `restorevar.bin`

They can be downloaded from https://modelscope.cn/models/nju9xh/RestoreVAR-ncnn/files

Run `scripts/stage-restorevar-models.sh` if local packaging is needed.

```bash
scripts/stage-restorevar-models.sh /path/to/restorevar_models
```

For local development the models are copied into:

`apps/guanfu-desktop/resources/models/`

