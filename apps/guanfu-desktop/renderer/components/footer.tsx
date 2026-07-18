import { translationAtom } from "@/atoms/translations-atom";
import { useAtomValue } from "jotai";
import React from "react";

function Footer() {
  const t = useAtomValue(translationAtom);

  return (
    <div className="p-2 text-center text-xs text-base-content/50">
      <p>
        {t("FOOTER.COPYRIGHT")} {new Date().getFullYear()} -{" "}
        <a
          className="font-bold"
          href="https://github.com/njulj/Guanfu"
          target="_blank"
        >
          Guanfu
        </a>
      </p>
      <p>Derived from Upscayl under AGPL-3.0.</p>
    </div>
  );
}

export default Footer;
