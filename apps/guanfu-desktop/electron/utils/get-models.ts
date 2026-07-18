import fs from "fs";
import path from "path";
import logit from "./logit";
import { MessageBoxOptions, app, dialog } from "electron";
import settings from "electron-settings";
import { FEATURE_FLAGS } from "../../common/feature-flags";

const getModelStem = (file: string) => file.substring(0, file.lastIndexOf(".")) || file;

const getModels = async (folderPath: string | undefined) => {
  let closeAccess;
  const customModelsBookmarks = await settings.get("custom-models-bookmarks");
  if (FEATURE_FLAGS.APP_STORE_BUILD && customModelsBookmarks) {
    try {
      closeAccess = app.startAccessingSecurityScopedResource(
        customModelsBookmarks as string,
      );
    } catch (error) {
      logit("📁 Custom Models Bookmarks Error: ", error);
    }
  }

  const showInvalidFolderDialog = (message: string) => {
    logit("❌ Invalid Custom Model Folder Detected: ", message);
    const options: MessageBoxOptions = {
      type: "error",
      title: "Invalid Model Folder",
      message,
      buttons: ["OK"],
    };
    dialog.showMessageBoxSync(options);
  };

  try {
    if (!folderPath || !fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
      showInvalidFolderDialog("Select a folder that contains matching '.param' and '.bin' model files.");
      return null;
    }

    const files = fs.readdirSync(folderPath);
    const paramModels = new Set<string>();
    const binModels = new Set<string>();

    for (const file of files) {
      const fullPath = path.join(folderPath, file);
      if (!fs.statSync(fullPath).isFile()) continue;

      const lower = file.toLowerCase();
      if (lower.endsWith(".param")) {
        paramModels.add(getModelStem(file));
      } else if (lower.endsWith(".bin")) {
        binModels.add(getModelStem(file));
      }
    }

    const models = [...paramModels]
      .filter((model) => binModels.has(model))
      .sort((a, b) => a.localeCompare(b));

    if (models.length === 0) {
      showInvalidFolderDialog(
        "The selected folder does not contain any complete model pair. Each custom model needs both 'model.param' and 'model.bin' with the same base name.",
      );
      return null;
    }

    const missingBins = [...paramModels].filter((model) => !binModels.has(model));
    const missingParams = [...binModels].filter((model) => !paramModels.has(model));
    if (missingBins.length > 0 || missingParams.length > 0) {
      logit(
        "⚠️ Ignored incomplete custom model files: ",
        JSON.stringify({ missingBins, missingParams }),
      );
    }

    logit("🔎 Detected Custom Models: ", models);
    return models;
  } finally {
    if (closeAccess) closeAccess();
  }
};

export default getModels;
