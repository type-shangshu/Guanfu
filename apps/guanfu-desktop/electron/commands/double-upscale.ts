import { parse } from "path";
import { getMainWindow } from "../main-window";
import {
  childProcesses,
  savedCustomModelsPath,
  setStopped,
  stopped,
} from "../utils/config-variables";
import slash from "../utils/slash";
import { spawnUpscale } from "../utils/spawn-upscale";
import {
  getDoubleUpscaleArguments,
  getDoubleUpscaleSecondPassArguments,
} from "../utils/get-arguments";
import { modelsPath } from "../utils/get-resource-paths";
import logit from "../utils/logit";
import { ELECTRON_COMMANDS } from "../../common/electron-commands";
import { DoubleUpscalePayload } from "../../common/types/types";
import { ImageFormat } from "../types/types";
import showNotification from "../utils/show-notification";
import getFilenameFromPath from "../../common/get-file-name";
import decodePath from "../../common/decode-path";
import getDirectoryFromPath from "../../common/get-directory-from-path";
import { MODELS } from "../../common/models-list";
import { copyMetadata } from "../utils/copy-metadata";

const doubleUpscale = async (event, payload: DoubleUpscalePayload) => {
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
    "_upscale_" +
    (useCustomWidth ? `${customWidth}px_` : `${scale}x_`) +
    model +
    "." +
    saveImageAs;

  // UPSCALE
  let upscaleProc = spawnUpscale(
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

  let upscaleProc2: ReturnType<typeof spawnUpscale>;

  childProcesses.push(upscaleProc);

  setStopped(false);
  let failed = false;
  let failed2 = false;

  // SECOND PASS FUNCTIONS
  const onError2 = (data) => {
    if (!mainWindow) return;
    data.toString();
    // SEND UPSCALE PROGRESS TO RENDERER
    mainWindow.webContents.send(
      ELECTRON_COMMANDS.DOUBLE_UPSCALE_PROGRESS,
      data,
    );
    // SET FAILED TO TRUE
    failed2 = true;
    mainWindow &&
      mainWindow.webContents.send(
        ELECTRON_COMMANDS.UPSCALE_ERROR,
        "Error upscaling image. Error: " + data,
      );
    showNotification("Upscale Failure", "Failed to upscale image!");
    upscaleProc2.kill();
    return;
  };

  const onData2 = (data) => {
    if (!mainWindow) return;
    // CONVERT DATA TO STRING
    data = data.toString();
    // SEND UPSCALE PROGRESS TO RENDERER
    mainWindow.webContents.send(
      ELECTRON_COMMANDS.DOUBLE_UPSCALE_PROGRESS,
      data,
    );
    // IF PROGRESS HAS ERROR, UPSCALE FAILED
    if (data.includes("Error") || data.includes("failed")) {
      upscaleProc2.kill();
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
        ELECTRON_COMMANDS.DOUBLE_UPSCALE_DONE,
        outFile,
      );
      showNotification("Upscaled", "Image upscaled successfully!");
    }
  };

  // FIRST PASS FUNCTIONS
  const onError = (data) => {
    if (!mainWindow) return;
    mainWindow.setProgressBar(-1);
    data.toString();
    // SEND UPSCALE PROGRESS TO RENDERER
    mainWindow.webContents.send(
      ELECTRON_COMMANDS.DOUBLE_UPSCALE_PROGRESS,
      data,
    );
    // SET FAILED TO TRUE
    failed = true;
    mainWindow &&
      mainWindow.webContents.send(
        ELECTRON_COMMANDS.UPSCALE_ERROR,
        "Error upscaling image. Error: " + data,
      );
    showNotification("Upscale Failure", "Failed to upscale image!");
    upscaleProc.kill();
    return;
  };

  const onData = (data) => {
    if (!mainWindow) return;
    // CONVERT DATA TO STRING
    data = data.toString();
    // SEND UPSCALE PROGRESS TO RENDERER
    mainWindow.webContents.send(
      ELECTRON_COMMANDS.DOUBLE_UPSCALE_PROGRESS,
      data,
    );
    // IF PROGRESS HAS ERROR, UPSCALE FAILED
    if (data.includes("Error") || data.includes("failed")) {
      upscaleProc.kill();
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
      upscaleProc2 = spawnUpscale(
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
      childProcesses.push(upscaleProc2);
      upscaleProc2.process.stderr.on("data", onData2);
      upscaleProc2.process.on("error", onError2);
      upscaleProc2.process.on("close", onClose2);
    }
  };

  upscaleProc.process.stderr.on("data", onData);
  upscaleProc.process.on("error", onError);
  upscaleProc.process.on("close", onClose);
};

export default doubleUpscale;
