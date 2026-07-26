import fs from "fs";
import { modelsPath } from "../utils/get-resource-paths";
import { ELECTRON_COMMANDS } from "../../common/electron-commands";
import {
  savedCustomModelsPath,
  setChildProcesses,
  setStopped,
  stopped,
} from "../utils/config-variables";
import { getSingleImageArguments } from "../utils/get-arguments";
import logit from "../utils/logit";
import slash from "../utils/slash";
import { spawnGuanfu } from "../utils/spawn-guanfu";
import { parse } from "path";
import { getMainWindow } from "../main-window";
import { ImageGuanfuPayload } from "../../common/types/types";
import { ImageFormat } from "../types/types";
import showNotification from "../utils/show-notification";
import getFilenameFromPath from "../../common/get-file-name";
import decodePath from "../../common/decode-path";
import getDirectoryFromPath from "../../common/get-directory-from-path";
import { MODELS } from "../../common/models-list";
import { getPlatform } from "../utils/get-device-specs";
import { copyMetadata } from "../utils/copy-metadata";

const imageGuanfu = async (event, payload: ImageGuanfuPayload) => {
  const mainWindow = getMainWindow();

  if (!mainWindow) {
    logit("No main window found");
    return;
  }

  // GET VARIABLES
  const tileSize = payload.tileSize;
  const compression = payload.compression;
  const ttaMode = payload.ttaMode;
  const scale = payload.scale;
  const useCustomWidth = payload.useCustomWidth;
  const customWidth = useCustomWidth ? payload.customWidth : "";
  const model = payload.model as string;
  const gpuId = payload.gpuId as string;
  const saveImageAs = payload.saveImageAs as ImageFormat;
  const overwrite = payload.overwrite as boolean;
  const imagePath = decodePath(payload.imagePath);
  let inputDir = getDirectoryFromPath(imagePath);
  let outputDir = decodePath(payload.outputPath);
  const fileNameWithExt = getFilenameFromPath(imagePath);
  const fileName = parse(fileNameWithExt).name;

  const outFile =
    outputDir +
    slash +
    fileName +
    "_guanfu_" +
    (useCustomWidth ? `${customWidth}px_` : `${scale}x_`) +
    model +
    "." +
    saveImageAs;

  const isDefaultModel = model in MODELS;

  // Check if filename is too long
  if (outFile.length >= 255) {
    if (getPlatform() === "win") {
      logit("Filename too long for Windows.");
      mainWindow.webContents.send(
        ELECTRON_COMMANDS.GUANFU_ERROR,
        "The filename exceeds the maximum path length allowed by Windows. Please shorten the filename or choose a different save location.",
      );
    } else {
      mainWindow.webContents.send(
        ELECTRON_COMMANDS.GUANFU_WARNING,
        "The output filename exceeds 255 characters, which is over the max path length allowed by Windows, though your OS supports it. Please consider shortening the filename next time.",
      );
    }
  }

  // UPSCALE
  if (fs.existsSync(outFile) && !overwrite) {
    // If already guanfued, just output that file
    logit("✅ Already guanfued at: ", outFile);
    mainWindow.webContents.send(ELECTRON_COMMANDS.GUANFU_DONE, outFile);
  } else {
    logit(
      "✅ Guanfu Variables: ",
      JSON.stringify({
        model,
        gpuId,
        saveImageAs,
        inputDir,
        fileNameWithExt,
        outputDir,
        outFile,
        fileName,
        scale,
        compression,
        customWidth,
        useCustomWidth,
        tileSize,
      }),
    );
    const guanfu = spawnGuanfu(
      getSingleImageArguments({
        inputDir: decodeURIComponent(inputDir),
        fileNameWithExt: decodeURIComponent(fileNameWithExt),
        outFile,
        modelsPath: isDefaultModel
          ? modelsPath
          : (savedCustomModelsPath ?? modelsPath),
        model,
        scale,
        gpuId,
        saveImageAs,
        customWidth,
        compression,
        tileSize,
        ttaMode,
      }),
      logit,
    );

    setChildProcesses(guanfu);

    setStopped(false);
    let failed = false;

    const onData = (data: string) => {
      logit(data.toString());
      mainWindow.setProgressBar(parseFloat(data.slice(0, data.length)) / 100);
      data = data.toString();
      mainWindow.webContents.send(
        ELECTRON_COMMANDS.GUANFU_PROGRESS,
        data.toString(),
      );
      if (data.includes("Error") || data.includes("failed")) {
        guanfu.kill();
        failed = true;
        onError(data);
      } else if (data.includes("Resizing")) {
        mainWindow.webContents.send(ELECTRON_COMMANDS.SCALING_AND_CONVERTING);
      }
    };
    const onError = (data) => {
      if (!mainWindow) return;
      mainWindow.setProgressBar(-1);
      mainWindow.webContents.send(
        ELECTRON_COMMANDS.GUANFU_ERROR,
        data.toString(),
      );
      failed = true;
      guanfu.kill();
      return;
    };
    const onClose = async () => {
      if (!failed && !stopped) {
        logit("💯 Done upscaling");
        // Free up memory
        guanfu.kill();
        mainWindow.setProgressBar(-1);
        if (payload.copyMetadata) {
          logit("🏷️ Copying metadata...");
          try {
            await copyMetadata(imagePath, outFile);
            logit("✅ Metadata copied to: ", outFile);
          } catch (error) {
            logit("❌ Error copying metadata: ", error);
            mainWindow.webContents.send(
              ELECTRON_COMMANDS.METADATA_ERROR,
              error,
            );
          }
        }
        mainWindow.webContents.send(ELECTRON_COMMANDS.GUANFU_DONE, outFile);
        showNotification("Guanfu", "Image guanfued successfully!");
      }
    };

    guanfu.process.stderr.on("data", onData);
    guanfu.process.on("error", onError);
    guanfu.process.on("close", onClose);
  }
};

export default imageGuanfu;
