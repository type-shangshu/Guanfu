import React from "react";
import { ELECTRON_COMMANDS } from "@common/electron-commands";
import { useAtomValue } from "jotai";
import { translationAtom } from "@/atoms/translations-atom";

type CustomModelsFolderSelectProps = {
  customModelsPath: string;
  setCustomModelsPath: (arg: string) => void;
};

export function CustomModelsFolderSelect({
  customModelsPath,
  setCustomModelsPath,
}: CustomModelsFolderSelectProps) {
  const t = useAtomValue(translationAtom);

  return (
    <div className="flex flex-col items-start gap-2">
      <p className="text-sm font-medium">Custom Models</p>
      <p className="text-xs leading-normal text-base-content/80">
        Select any folder containing matching model files, for example
        <span className="mx-1 font-mono">restorevar.param</span>
        and
        <span className="mx-1 font-mono">restorevar.bin</span>.
      </p>
      <p className="break-all text-sm text-base-content/60">
        {customModelsPath || "No custom model folder selected"}
      </p>
      <button
        className="btn btn-primary"
        onClick={async () => {
          const customModelPath = await window.electron.invoke(
            ELECTRON_COMMANDS.SELECT_CUSTOM_MODEL_FOLDER,
          );

          if (customModelPath !== null) {
            setCustomModelsPath(customModelPath);
            window.electron.send(
              ELECTRON_COMMANDS.GET_MODELS_LIST,
              customModelPath,
            );
          } else {
            setCustomModelsPath("");
          }
        }}
      >
        {t("SETTINGS.CUSTOM_MODELS.BUTTON_FOLDER")}
      </button>
    </div>
  );
}
