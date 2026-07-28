import { useState, useEffect } from "react";

const useAppVersion = () => {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    const match = navigator?.userAgent?.match(
      /(?:Guanfu|Upscayl)\/([\d.]+\d+)/,
    )?.[1];
    setVersion(match ?? null);
  }, []);

  return version;
};

export default useAppVersion;
