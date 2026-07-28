import { app, dialog } from "electron";
import {
  savedBatchUpscaleFolderPath,
  setSavedBatchUpscaleFolderPath,
} from "../utils/config-variables";
import logit from "../utils/logit";
import settings from "electron-settings";
import { FEATURE_FLAGS } from "../../common/feature-flags";

const selectFolder = async (event, message) => {
  let closeAccess;
  const folderBookmarks = await settings.get("folder-bookmarks");
  if (FEATURE_FLAGS.APP_STORE_BUILD && folderBookmarks) {
    logit("🚨 Folder Bookmarks: ", folderBookmarks);
    try {
      closeAccess = app.startAccessingSecurityScopedResource(
        folderBookmarks as string,
      );
    } catch (error) {
      logit("📁 Folder Bookmarks Error: ", error);
    }
  }

  const {
    canceled,
    filePaths: folderPaths,
    bookmarks,
  } = await dialog.showOpenDialog({
    properties: ["openDirectory"],
    defaultPath: savedBatchUpscaleFolderPath,
    securityScopedBookmarks: true,
  });

  if (FEATURE_FLAGS.APP_STORE_BUILD && bookmarks && bookmarks.length > 0) {
    console.log("🚨 Setting folder Bookmark: ", bookmarks);
    await settings.set("folder-bookmarks", bookmarks[0]);
  }

  if (canceled) {
    logit("🚫 Select Folder Operation Cancelled");
    return null;
  } else {
    setSavedBatchUpscaleFolderPath(folderPaths[0]);
    logit("📁 Selected Folder Path: ", savedBatchUpscaleFolderPath);
    return folderPaths[0];
  }
};

export default selectFolder;
