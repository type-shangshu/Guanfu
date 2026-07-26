import { useState, useEffect } from "react";

const useGuanfuVersion = () => {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    const guanfuVersion = navigator?.userAgent?.match(
      /(?:Guanfu|Guanfu)\/([\d.]+\d+)/,
    )?.[1];
    setVersion(guanfuVersion ?? null);
  }, []);

  return version;
};

export default useGuanfuVersion;
