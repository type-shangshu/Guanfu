import { parse } from "path";
import { getMainWindow } from "../main-window";
import {
  childProcesses,
  savedCustomModelsPath,
  setStopped,
  stopped,
} from "../utils/config-variables";
import slash from "../utils/slash";
import { spawnGuanfu } from "../utils/spawn-guanfu";
import {
  getDoubleUpscaleArguments,
  getDoubleUpscaleSecondPassArguments,
} from "../utils/get-arguments";
import { modelsPath } from "../utils/get-resource-paths";
import logit from "../utils/logit";
import { ELECTRON_COMMANDS } from "../../common/electron-commands";
import { DoubleGuanfuPayload } from "../../common/types/types";
import { ImageFormat } from "../types/types";
import showNotification from "../utils/show-notification";
import getFilenameFromPath from "../../common/get-file-name";
import decodePath from "../../common/decode-path";
import getDirectoryFromPath from "../../common/get-directory-from-path";
import { MODELS } from "../../common/models-list";
import { copyMetadata } from "../utils/copy-metadata";

const doubleGuanfu = async (event, payload: DoubleGuanfuPayload) => {
  const mainWindow = getMainWindow();
  if (!mainWindow) return;

  const tileSize = payload.tileSize;
  const compression = payload.compression;
  const ttaMode = payload.ttaMode;
  const scale = payload.scale;
  const useCustomWidth = payload.useCustomWidth;
  const customWidth = useCustomWidth ? payload.customWidth : "";
  const model = payload.model;
  const gpuId = payload.gpuId as string;
  const saveImageAs = payload.saveImageAs as ImageFormat;
  const imagePath = decodePath(payload.imagePath);
  let inputDir = getDirectoryFromPath(imagePath);
  let outputDir = decodePath(payload.outputPath);
  const fullfileName = getFilenameFromPath(imagePath);
  const fileName = parse(fullfileName).name;

  const isDefaultModel = model in MODELS;

  // COPY IMAGE TO TMP FOLDER

  const outFile =
    outputDir +
    slash +
    fileName +
    "_guanfu_" +
    (useCustomWidth ? `${customWidth}px_` : `${scale}x_`) +
    model +
    "." +
    saveImageAs;

  // UPSCALE
  let guanfu = spawnGuanfu(
    getDoubleUpscaleArguments({
      inputDir,
      fullfileName: decodeURIComponent(fullfileName),
      outFile,
      modelsPath: isDefaultModel
        ? modelsPath
        : (savedCustomModelsPath ?? modelsPath),
      model,
      scale,
      customWidth,
      gpuId,
      saveImageAs,
      tileSize,
    }),
    logit,
  );

  let guanfu2: ReturnType<typeof spawnGuanfu>;

  childProcesses.push(guanfu);

  setStopped(false);
  let failed = false;
  let failed2 = false;

  // SECOND PASS FUNCTIONS
  const onError2 = (data) => {
    if (!mainWindow) return;
    data.toString();
    // SEND GUANFU PROGRESS TO RENDERER
    mainWindow.webContents.send(
      ELECTRON_COMMANDS.DOUBLE_GUANFU_PROGRESS,
      data,
    );
    // SET FAILED TO TRUE
    failed2 = true;
    mainWindow &&
      mainWindow.webContents.send(
        ELECTRON_COMMANDS.GUANFU_ERROR,
        "Error upscaling image. Error: " + data,
      );
    showNotification("Guanfu Failure", "Failed to upscale image!");
    guanfu2.kill();
    return;
  };

  const onData2 = (data) => {
    if (!mainWindow) return;
    // CONVERT DATA TO STRING
    data = data.toString();
    // SEND GUANFU PROGRESS TO RENDERER
    mainWindow.webContents.send(
      ELECTRON_COMMANDS.DOUBLE_GUANFU_PROGRESS,
      data,
    );
    // IF PROGRESS HAS ERROR, GUANFU FAILED
    if (data.includes("Error") || data.includes("failed")) {
      guanfu2.kill();
      failed2 = true;
      onError2(data);
    } else if (data.includes("Resizing")) {
      mainWindow.webContents.send(ELECTRON_COMMANDS.SCALING_AND_CONVERTING);
    }
  };

  const onClose2 = async (code) => {
    if (!mainWindow) return;
    if (!failed2 && !stopped) {
      logit("💯 Done upscaling");

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
      mainWindow.webContents.send(
        ELECTRON_COMMANDS.DOUBLE_GUANFU_DONE,
        outFile,
      );
      showNotification("Guanfued", "Image guanfued successfully!");
    }
  };

  // FIRST PASS FUNCTIONS
  const onError = (data) => {
    if (!mainWindow) return;
    mainWindow.setProgressBar(-1);
    data.toString();
    // SEND GUANFU PROGRESS TO RENDERER
    mainWindow.webContents.send(
      ELECTRON_COMMANDS.DOUBLE_GUANFU_PROGRESS,
      data,
    );
    // SET FAILED TO TRUE
    failed = true;
    mainWindow &&
      mainWindow.webContents.send(
        ELECTRON_COMMANDS.GUANFU_ERROR,
        "Error upscaling image. Error: " + data,
      );
    showNotification("Guanfu Failure", "Failed to upscale image!");
    guanfu.kill();
    return;
  };

  const onData = (data) => {
    if (!mainWindow) return;
    // CONVERT DATA TO STRING
    data = data.toString();
    // SEND GUANFU PROGRESS TO RENDERER
    mainWindow.webContents.send(
      ELECTRON_COMMANDS.DOUBLE_GUANFU_PROGRESS,
      data,
    );
    // IF PROGRESS HAS ERROR, GUANFU FAILED
    if (data.includes("Error") || data.includes("failed")) {
      guanfu.kill();
      failed = true;
      onError(data);
    } else if (data.includes("Resizing")) {
      mainWindow.webContents.send(ELECTRON_COMMANDS.SCALING_AND_CONVERTING);
    }
  };

  const onClose = (code) => {
    // IF NOT FAILED
    if (!failed && !stopped) {
      // SPAWN A SECOND PASS
      guanfu2 = spawnGuanfu(
        getDoubleUpscaleSecondPassArguments({
          outFile,
          modelsPath: isDefaultModel
            ? modelsPath
            : (savedCustomModelsPath ?? modelsPath),
          model,
          gpuId,
          saveImageAs,
          scale,
          customWidth,
          compression,
          tileSize,
          ttaMode,
        }),
        logit,
      );
      logit("🚀 Upscaling Second Pass");
      childProcesses.push(guanfu2);
      guanfu2.process.stderr.on("data", onData2);
      guanfu2.process.on("error", onError2);
      guanfu2.process.on("close", onClose2);
    }
  };

  guanfu.process.stderr.on("data", onData);
  guanfu.process.on("error", onError);
  guanfu.process.on("close", onClose);
};

export default doubleGuanfu;
