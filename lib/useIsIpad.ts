"use client";

import { useEffect, useState } from "react";

function detectIpad(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";

  // iPadOS 13+ can report as Mac; touch points disambiguate it.
  const isIpadByUa = /iPad/i.test(ua);
  const isIpadOsDesktopMode = platform === "MacIntel" && (navigator.maxTouchPoints ?? 0) > 1;
  return isIpadByUa || isIpadOsDesktopMode;
}

export function useIsIpad(): boolean {
  const [isIpad, setIsIpad] = useState(false);

  useEffect(() => {
    setIsIpad(detectIpad());
  }, []);

  return isIpad;
}
