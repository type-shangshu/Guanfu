"use client";
import { useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  batchModeAtom,
  compressionAtom,
  dontShowCloudModalAtom,
  noImageProcessingAtom,
  savedOutputPathAtom,
  overwriteAtom,
  progressAtom,
  scaleAtom,
  customWidthAtom,
  useCustomWidthAtom,
  tileSizeAtom,
  showSidebarAtom,
  selectedModelIdAtom,
  doubleUpscaleAtom,
  gpuIdAtom,
  saveImageAsAtom,
  userStatsAtom,
  ttaModeAtom,
  copyMetadataAtom,
} from "../../atoms/user-settings-atom";
import useLogger from "../hooks/use-logger";
import {
  BatchUpscalePayload,
  DoubleUpscalePayload,
  ImageUpscalePayload,
} from "@common/types/types";
import { useToast } from "@/components/ui/use-toast";
import UpscaleSteps from "./upscale-tab/upscale-steps";
import SettingsTab from "./settings-tab";
import Footer from "../footer";
import Tabs from "../tabs";
import Header from "../header";
import { ChevronLeftIcon } from "lucide-react";
import { logAtom } from "@/atoms/log-atom";
import { ELECTRON_COMMANDS } from "@common/electron-commands";
import useAppVersion from "../hooks/use-app-version";
import useTranslation from "../hooks/use-translation";
import GuanfuLogo from "./guanfu-logo";
import SidebarToggleButton from "./sidebar-button";

const Sidebar = ({
  setUpscaledImagePath,
  batchFolderPath,
  setUpscaledBatchFolderPath,
  dimensions,
  imagePath,
  selectImageHandler,
  selectFolderHandler,
}: {
  setUpscaledImagePath: React.Dispatch<React.SetStateAction<string>>;
  batchFolderPath: string;
  setUpscaledBatchFolderPath: React.Dispatch<React.SetStateAction<string>>;
  dimensions: {
    width: number | null;
    height: number | null;
  };
  imagePath: string;
  selectImageHandler: () => Promise<void>;
  selectFolderHandler: () => Promise<void>;
}) => {
  const t = useTranslation();
  const logit = useLogger();
  const { toast } = useToast();
  const version = useAppVersion();

  // LOCAL STATES
  // TODO: Add electron handler for os
  const [selectedModelId, setSelectedModelId] = useAtom(selectedModelIdAtom);
  const [doubleUpscale, setDoubleUpscale] = useAtom(doubleUpscaleAtom);
  const [gpuId, setGpuId] = useAtom(gpuIdAtom);
  const [saveImageAs, setSaveImageAs] = useAtom(saveImageAsAtom);

  const [selectedTab, setSelectedTab] = useState(0);
  const [showCloudModal, setShowCloudModal] = useState(false);

  // ATOMIC STATES
  const overwrite = useAtomValue(overwriteAtom);
  const outputPath = useAtomValue(savedOutputPathAtom);
  const [compression, setCompression] = useAtom(compressionAtom);
  const setProgress = useSetAtom(progressAtom);
  const [batchMode, setBatchMode] = useAtom(batchModeAtom);
  const logData = useAtomValue(logAtom);
  const [scale] = useAtom(scaleAtom);
  const setDontShowCloudModal = useSetAtom(dontShowCloudModalAtom);
  const noImageProcessing = useAtomValue(noImageProcessingAtom);
  const customWidth = useAtomValue(customWidthAtom);
  const useCustomWidth = useAtomValue(useCustomWidthAtom);
  const tileSize = useAtomValue(tileSizeAtom);
  const [showSidebar, setShowSidebar] = useAtom(showSidebarAtom);
  const setUserStats = useSetAtom(userStatsAtom);
  const ttaMode = useAtomValue(ttaModeAtom);
  const [copyMetadata] = useAtom(copyMetadataAtom);

  const upscaleHandler = async () => {
    logit("🔄 Resetting Upscaled Image Path");
    setUpscaledImagePath("");
    setUpscaledBatchFolderPath("");
    if (imagePath !== "" || batchFolderPath !== "") {
      setProgress(t("APP.PROGRESS.WAIT_TITLE"));
      // Double Upscale
      if (doubleUpscale) {
        window.electron.send<DoubleUpscalePayload>(
          ELECTRON_COMMANDS.DOUBLE_UPSCALE,
          {
            imagePath,
            outputPath,
            model: selectedModelId,
            gpuId: gpuId.length === 0 ? null : gpuId,
            saveImageAs,
            scale,
            noImageProcessing,
            compression: compression.toString(),
            customWidth: customWidth > 0 ? customWidth.toString() : null,
            useCustomWidth,
            tileSize,
            ttaMode,
            copyMetadata,
          },
        );
        setUserStats((prev) => ({
          ...prev,
          totalUpscales: prev.totalUpscales + 1,
          lastUsedAt: new Date().getTime(),
          doubleUpscales: prev.doubleUpscales + 1,
          imageUpscales: prev.imageUpscales + 1,
        }));
        logit("🏁 DOUBLE_UPSCALE");
      } else if (batchMode) {
        // Batch Upscale
        setDoubleUpscale(false);
        window.electron.send<BatchUpscalePayload>(
          ELECTRON_COMMANDS.FOLDER_UPSCALE,
          {
            batchFolderPath,
            outputPath,
            model: selectedModelId,
            gpuId: gpuId.length === 0 ? null : gpuId,
            saveImageAs,
            scale,
            noImageProcessing,
            compression: compression.toString(),
            customWidth: customWidth > 0 ? customWidth.toString() : null,
            useCustomWidth,
            tileSize,
            ttaMode,
            copyMetadata,
          },
        );
        setUserStats((prev) => ({
          ...prev,
          totalUpscales: prev.totalUpscales + 1,
          lastUsedAt: new Date().getTime(),
          batchUpscales: prev.doubleUpscales + 1,
        }));
        logit("🏁 FOLDER_UPSCALE");
      } else {
        // Single Image Upscale
        window.electron.send<ImageUpscalePayload>(ELECTRON_COMMANDS.UPSCALE, {
          imagePath,
          outputPath,
          model: selectedModelId,
          gpuId: gpuId.length === 0 ? null : gpuId,
          saveImageAs,
          scale,
          overwrite,
          noImageProcessing,
          compression: compression.toString(),
          customWidth: customWidth > 0 ? customWidth.toString() : null,
          useCustomWidth,
          tileSize,
          ttaMode,
          copyMetadata,
        });
        setUserStats((prev) => ({
          ...prev,
          totalUpscales: prev.totalUpscales + 1,
          lastUsedAt: new Date().getTime(),
          imageUpscales: prev.imageUpscales + 1,
        }));
        logit("🏁 UPSCALE");
      }
    } else {
      toast({
        title: t("ERRORS.NO_IMAGE_ERROR.TITLE"),
        description: t("ERRORS.NO_IMAGE_ERROR.DESCRIPTION"),
      });
      logit("🚫 No valid image selected");
    }
  };

  return (
    <>
      {/* TOP LOGO WHEN SIDEBAR IS HIDDEN */}
      {!showSidebar && <GuanfuLogo />}

      <SidebarToggleButton
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
      />

      <div
        className={`relative flex h-screen min-w-[350px] max-w-[350px] flex-col bg-base-100 ${showSidebar ? "" : "hidden"}`}
      >
        <button
          className="absolute -right-0 top-1/2 z-50 -translate-y-1/2 translate-x-1/2 rounded-full bg-base-100 p-4"
          onClick={() => setShowSidebar((prev) => !prev)}
        >
          <ChevronLeftIcon />
        </button>

        {window.electron.platform === "mac" && (
          <div className="mac-titlebar pt-8"></div>
        )}

        <Header version={version} />

        <Tabs selectedTab={selectedTab} setSelectedTab={setSelectedTab} />

        {selectedTab === 0 && (
          <UpscaleSteps
            selectImageHandler={selectImageHandler}
            selectFolderHandler={selectFolderHandler}
            upscaleHandler={upscaleHandler}
            batchMode={batchMode}
            setBatchMode={setBatchMode}
            imagePath={imagePath}
            doubleUpscale={doubleUpscale}
            setDoubleUpscale={setDoubleUpscale}
            dimensions={dimensions}
            setGpuId={setGpuId}
            setSaveImageAs={setSaveImageAs}
          />
        )}

        {selectedTab === 1 && (
          <SettingsTab
            batchMode={batchMode}
            compression={compression}
            setCompression={setCompression}
            gpuId={gpuId}
            setGpuId={setGpuId}
            saveImageAs={saveImageAs}
            setSaveImageAs={setSaveImageAs}
            logData={logData}
            show={showCloudModal}
            setShow={setShowCloudModal}
            setDontShowCloudModal={setDontShowCloudModal}
          />
        )}
        <Footer />
      </div>
    </>
  );
};

export default Sidebar;
