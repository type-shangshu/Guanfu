import { dialog } from "electron";
import {
  savedCustomModelsPath,
  setSavedCustomModelsPath,
} from "../utils/config-variables";
import logit from "../utils/logit";
import { ELECTRON_COMMANDS } from "../../common/electron-commands";
import getModels from "../utils/get-models";
import { getMainWindow } from "../main-window";
import settings from "electron-settings";
import { FEATURE_FLAGS } from "../../common/feature-flags";

const customModelsSelect = async (event, message) => {
  const mainWindow = getMainWindow();

  if (!mainWindow) return;
  const {
    canceled,
    filePaths: folderPaths,
    bookmarks,
  } = await dialog.showOpenDialog({
    properties: ["openDirectory"],
    title: "Select Custom Model Folder",
    defaultPath: savedCustomModelsPath,
    securityScopedBookmarks: true,
    message: "Select a folder containing matching .param and .bin model files",
  });

  if (FEATURE_FLAGS.APP_STORE_BUILD && bookmarks && bookmarks.length > 0) {
    console.log("🚨 Setting Bookmark: ", bookmarks);
    await settings.set("custom-models-bookmarks", bookmarks[0]);
  }

  if (canceled) {
    logit("🚫 Select Custom Models Folder Operation Cancelled");
    return null;
  } else {
    setSavedCustomModelsPath(folderPaths[0]);


    const models = await getModels(savedCustomModelsPath);
    mainWindow.webContents.send(
      ELECTRON_COMMANDS.CUSTOM_MODEL_FILES_LIST,
      models,
    );

    logit("📁 Custom Folder Path: ", savedCustomModelsPath);
    return savedCustomModelsPath;
  }
};

export default customModelsSelect;
