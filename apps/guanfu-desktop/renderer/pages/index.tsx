"use client";
import { useState, useEffect } from "react";
import { ELECTRON_COMMANDS } from "@common/electron-commands";
import { useAtomValue, useSetAtom } from "jotai";
import { customModelIdsAtom } from "../atoms/models-list-atom";
import {
  batchModeAtom,
  savedOutputPathAtom,
  progressAtom,
  rememberOutputFolderAtom,
  userStatsAtom,
} from "../atoms/user-settings-atom";
import useLogger from "../components/hooks/use-logger";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import GuanfuSVGLogo from "@/components/icons/guanfu-logo-svg";
import { translationAtom } from "@/atoms/translations-atom";
import Sidebar from "@/components/sidebar";
import MainContent from "@/components/main-content";
import getDirectoryFromPath from "@common/get-directory-from-path";
import { FEATURE_FLAGS } from "@common/feature-flags";
import { ImageFormat, VALID_IMAGE_FORMATS } from "@/lib/valid-formats";
import { initCustomModels } from "@/components/hooks/use-custom-models";
import useSystemInfo from "@/components/hooks/use-system-info";

const Home = () => {
  const t = useAtomValue(translationAtom);
  const logit = useLogger();
  const { toast } = useToast();
  const { systemInfo } = useSystemInfo();

  initCustomModels();

  const [isLoading, setIsLoading] = useState(true);
  const [imagePath, setImagePath] = useState("");
  const [upscaledImagePath, setUpscaledImagePath] = useState("");
  const [dimensions, setDimensions] = useState({
    width: null,
    height: null,
  });
  const setOutputPath = useSetAtom(savedOutputPathAtom);
  const rememberOutputFolder = useAtomValue(rememberOutputFolderAtom);
  const batchMode = useAtomValue(batchModeAtom);
  const [batchFolderPath, setBatchFolderPath] = useState("");
  const [upscaledBatchFolderPath, setUpscaledBatchFolderPath] = useState("");
  const setProgress = useSetAtom(progressAtom);
  const [doubleUpscaleCounter, setDoubleUpscaleCounter] = useState(0);
  const setModelIds = useSetAtom(customModelIdsAtom);
  const setUserStats = useSetAtom(userStatsAtom);

  const selectImageHandler = async () => {
    resetImagePaths();
    const path = await window.electron.invoke(ELECTRON_COMMANDS.SELECT_FILE);
    if (path === null) return;
    logit("🖼 Selected Image Path: ", path);
    setImagePath(path);
    const dirname = getDirectoryFromPath(path);
    logit("📁 Selected Image Directory: ", dirname);
    if (!FEATURE_FLAGS.APP_STORE_BUILD) {
      if (!rememberOutputFolder) {
        setOutputPath(dirname);
      }
    }
    validateImagePath(path);
  };

  const selectFolderHandler = async () => {
    resetImagePaths();
    const path = await window.electron.invoke(ELECTRON_COMMANDS.SELECT_FOLDER);
    if (path !== null) {
      logit("🖼 Selected Folder Path: ", path);
      setBatchFolderPath(path);
      if (!rememberOutputFolder) {
        setOutputPath(path);
      }
    } else {
      logit("🚫 Folder selection cancelled");
      setBatchFolderPath("");
      if (!rememberOutputFolder) {
        setOutputPath("");
      }
    }
  };

  const validateImagePath = (path: string) => {
    if (path.length > 0) {
      logit("🖼 imagePath: ", path);
      const extension = path.split(".").pop().toLowerCase() as ImageFormat;
      logit("🔤 Extension: ", extension);
      if (!VALID_IMAGE_FORMATS.includes(extension)) {
        toast({
          title: t("ERRORS.INVALID_IMAGE_ERROR.TITLE"),
          description: t("ERRORS.INVALID_IMAGE_ERROR.DESCRIPTION"),
        });
        resetImagePaths();
      }
    } else {
      resetImagePaths();
    }
  };

  // ELECTRON EVENT LISTENERS
  useEffect(() => {
    const handleErrors = (data: string) => {
      if (data.includes("Invalid GPU")) {
        toast({
          title: t("ERRORS.GPU_ERROR.TITLE"),
          description: t("ERRORS.GPU_ERROR.DESCRIPTION", { data }),
          action: (
            <div className="flex flex-col gap-2">
              <ToastAction
                altText={t("ERRORS.COPY_ERROR.TITLE")}
                onClick={() => {
                  navigator.clipboard.writeText(data);
                }}
              >
                {t("ERRORS.COPY_ERROR.TITLE")}
              </ToastAction>
              <a href="https://docs.upscaleProc.org/" target="_blank">
                <ToastAction altText={t("ERRORS.OPEN_DOCS_TITLE")}>
                  {t("ERRORS.OPEN_DOCS_BUTTON_TITLE")}
                </ToastAction>
              </a>
            </div>
          ),
        });
        resetImagePaths();
      } else if (data.includes("write") || data.includes("read")) {
        if (batchMode) return;
        toast({
          title: t("ERRORS.READ_WRITE_ERROR.TITLE"),
          description: t("ERRORS.READ_WRITE_ERROR.DESCRIPTION", { data }),
          action: (
            <div className="flex flex-col gap-2">
              <ToastAction
                altText="Copy Error"
                onClick={() => {
                  navigator.clipboard.writeText(data);
                }}
              >
                {t("ERRORS.COPY_ERROR.TITLE")}
              </ToastAction>
              <a href="https://docs.upscaleProc.org/" target="_blank">
                <ToastAction altText={t("ERRORS.OPEN_DOCS_TITLE")}>
                  {t("ERRORS.OPEN_DOCS_BUTTON_TITLE")}
                </ToastAction>
              </a>
            </div>
          ),
        });
        resetImagePaths();
      } else if (data.includes("tile size")) {
        toast({
          title: t("ERRORS.TILE_SIZE_ERROR.TITLE"),
          description: t("ERRORS.TILE_SIZE_ERROR.DESCRIPTION", { data }),
        });
        resetImagePaths();
      } else if (data.includes("uncaughtException")) {
        toast({
          title: t("ERRORS.EXCEPTION_ERROR.TITLE"),
          description: t("ERRORS.EXCEPTION_ERROR.DESCRIPTION"),
        });
        resetImagePaths();
      }
    };
    // LOG
    window.electron.on(ELECTRON_COMMANDS.LOG, (_, data: string) => {
      logit(`🎒 BACKEND REPORTED: `, data);
    });
    // SCALING AND CONVERTING
    window.electron.on(
      ELECTRON_COMMANDS.SCALING_AND_CONVERTING,
      (_, data: string) => {
        setProgress(t("APP.PROGRESS.PROCESSING_TITLE"));
      },
    );
    // UPSCALE WARNING
    window.electron.on(ELECTRON_COMMANDS.UPSCALE_WARNING, (_, data: string) => {
      toast({
        title: t("WARNING.GENERIC_WARNING.TITLE"),
        description: data,
      });
    });
    // METADATA ERROR
    window.electron.on(ELECTRON_COMMANDS.METADATA_ERROR, (_, data: string) => {
      toast({
        title: t("ERRORS.METADATA_ERROR.TITLE"),
        description: data,
      });
    });
    // UPSCALE ERROR
    window.electron.on(ELECTRON_COMMANDS.UPSCALE_ERROR, (_, data: string) => {
      toast({
        title: t("ERRORS.GENERIC_ERROR.TITLE"),
        description: data,
      });
      resetImagePaths();
    });
    // UPSCALE PROGRESS
    window.electron.on(
      ELECTRON_COMMANDS.UPSCALE_PROGRESS,
      (_, data: string) => {
        if (data.length > 0 && data.length < 10) {
          setProgress(data);
        } else if (data.includes("converting")) {
          setProgress(t("APP.PROGRESS.SCALING_CONVERTING_TITLE"));
        } else if (data.includes("Successful")) {
          setProgress(t("APP.PROGRESS.SUCCESS_TITLE"));
        }
        handleErrors(data);
        logit(`🚧 UPSCALE_PROGRESS: `, data);
      },
    );
    // FOLDER UPSCALE PROGRESS
    window.electron.on(
      ELECTRON_COMMANDS.FOLDER_UPSCALE_PROGRESS,
      (_, data: string) => {
        if (data.includes("Successful")) {
          setProgress(t("APP.PROGRESS.SUCCESS_TITLE"));
        }
        if (data.length > 0 && data.length < 10) {
          setProgress(data);
        }
        handleErrors(data);
        logit(`🚧 FOLDER_UPSCALE_PROGRESS: `, data);
      },
    );
    // DOUBLE UPSCALE PROGRESS
    window.electron.on(
      ELECTRON_COMMANDS.DOUBLE_UPSCALE_PROGRESS,
      (_, data: string) => {
        if (data.length > 0 && data.length < 10) {
          if (data === "0.00%") {
            setDoubleUpscaleCounter(doubleUpscaleCounter + 1);
          }
          setProgress(data);
        }
        handleErrors(data);
        logit(`🚧 DOUBLE_UPSCALE_PROGRESS: `, data);
      },
    );
    // UPSCALE DONE
    window.electron.on(ELECTRON_COMMANDS.UPSCALE_DONE, (_, data: string) => {
      setProgress("");
      setUpscaledImagePath(data);
      setUserStats((prev) => ({
        ...prev,
        lastUpscaleDuration: new Date().getTime() - prev.lastUsedAt,
        averageUpscaleTime:
          (prev.averageUpscaleTime * prev.totalUpscales +
            (new Date().getTime() - prev.lastUsedAt)) /
          (prev.totalUpscales + 1),
      }));
      logit("upscaledImagePath: ", data);
      logit(`💯 UPSCALE_DONE: `, data);
    });
    // FOLDER UPSCALE DONE
    window.electron.on(
      ELECTRON_COMMANDS.FOLDER_UPSCALE_DONE,
      (_, data: string) => {
        setProgress("");
        setUpscaledBatchFolderPath(data);
        logit(`💯 FOLDER_UPSCALE_DONE: `, data);
        setUserStats((prev) => ({
          ...prev,
          lastUpscaleDuration: new Date().getTime() - prev.lastUsedAt,
          averageUpscaleTime:
            (prev.averageUpscaleTime * prev.totalUpscales +
              (new Date().getTime() - prev.lastUsedAt)) /
            (prev.totalUpscales + 1),
        }));
      },
    );
    // DOUBLE UPSCALE DONE
    window.electron.on(
      ELECTRON_COMMANDS.DOUBLE_UPSCALE_DONE,
      (_, data: string) => {
        setProgress("");
        setTimeout(() => setUpscaledImagePath(data), 500);
        setDoubleUpscaleCounter(0);
        logit(`💯 DOUBLE_UPSCALE_DONE: `, data);
        setUserStats((prev) => ({
          ...prev,
          lastUpscaleDuration: new Date().getTime() - prev.lastUsedAt,
          averageUpscaleTime:
            (prev.averageUpscaleTime * prev.totalUpscales +
              (new Date().getTime() - prev.lastUsedAt)) /
            (prev.totalUpscales + 1),
        }));
      },
    );
    // CUSTOM FOLDER LISTENER
    window.electron.on(
      ELECTRON_COMMANDS.CUSTOM_MODEL_FILES_LIST,
      (_, data: string[]) => {
        logit(`📜 CUSTOM_MODEL_FILES_LIST: `, data);
        console.log("🚀 => data:", data);
        setModelIds(data);
      },
    );
  }, []);

  // LOADING STATE
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // SYSTEM INFO
  useEffect(() => {
    if (systemInfo) logit("💻 System Info:", JSON.stringify(systemInfo));
  }, [systemInfo]);

  // HANDLERS
  const resetImagePaths = () => {
    logit("🔄 Resetting image paths");
    setDimensions({
      width: null,
      height: null,
    });
    setProgress("");
    setImagePath("");
    setUpscaledImagePath("");
    setBatchFolderPath("");
    setUpscaledBatchFolderPath("");
  };

  if (isLoading) {
    return (
      <GuanfuSVGLogo className="absolute left-1/2 top-1/2 w-36 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
    );
  }

  return (
    <div
      className="flex h-screen w-screen flex-row overflow-hidden bg-base-300"
      onPaste={(e) => console.log(e)}
    >
      <Sidebar
        imagePath={imagePath}
        dimensions={dimensions}
        setUpscaledImagePath={setUpscaledImagePath}
        batchFolderPath={batchFolderPath}
        setUpscaledBatchFolderPath={setUpscaledBatchFolderPath}
        selectImageHandler={selectImageHandler}
        selectFolderHandler={selectFolderHandler}
      />
      <MainContent
        imagePath={imagePath}
        resetImagePaths={resetImagePaths}
        upscaledBatchFolderPath={upscaledBatchFolderPath}
        setImagePath={setImagePath}
        validateImagePath={validateImagePath}
        selectFolderHandler={selectFolderHandler}
        selectImageHandler={selectImageHandler}
        batchFolderPath={batchFolderPath}
        upscaledImagePath={upscaledImagePath}
        doubleUpscaleCounter={doubleUpscaleCounter}
        setDimensions={setDimensions}
      />
    </div>
  );
};

export default Home;
