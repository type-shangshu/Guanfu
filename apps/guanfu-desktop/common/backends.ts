export const BACKENDS = {
  "upscayl-ncnn": {
    id: "upscayl-ncnn",
    label: "Upscayl NCNN",
    description: "General-purpose RealESRGAN-compatible NCNN backend.",
  },
  "restorevar-ncnn": {
    id: "restorevar-ncnn",
    label: "RestoreVAR NCNN",
    description: "RestoreVAR x4 restoration backend packaged through upscayl-ncnn.",
  },
} as const;

export type BackendId = keyof typeof BACKENDS;

export const DEFAULT_BACKEND_ID: BackendId = "upscayl-ncnn";
export const RESTOREVAR_BACKEND_ID: BackendId = "restorevar-ncnn";

export function getBackendModel(backendId: BackendId | null | undefined, model: string) {
  return backendId === RESTOREVAR_BACKEND_ID ? "restorevar" : model;
}

export function getBackendScale(backendId: BackendId | null | undefined, scale: string) {
  return backendId === RESTOREVAR_BACKEND_ID ? "4" : scale;
}
