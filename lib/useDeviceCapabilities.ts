"use client";

import { useEffect, useState } from "react";

function detectIpad(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";

  const isIpadByUa = /iPad/i.test(ua);
  const isIpadDesktopMode = platform === "MacIntel" && (navigator.maxTouchPoints ?? 0) > 1;
  return isIpadByUa || isIpadDesktopMode;
}

export function useDeviceCapabilities() {
  const [canHover, setCanHover] = useState(false);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  const [isIpad, setIsIpad] = useState(false);

  useEffect(() => {
    const hoverMedia = window.matchMedia("(hover: hover)");
    const coarseMedia = window.matchMedia("(hover: none), (pointer: coarse)");

    const update = () => {
      setCanHover(hoverMedia.matches);
      setIsCoarsePointer(coarseMedia.matches);
      setIsIpad(detectIpad());
    };

    update();
    hoverMedia.addEventListener("change", update);
    coarseMedia.addEventListener("change", update);

    return () => {
      hoverMedia.removeEventListener("change", update);
      coarseMedia.removeEventListener("change", update);
    };
  }, []);

  return {
    canHover,
    isCoarsePointer,
    isIpad,
    enableHoverTooltip: canHover || isIpad
  };
}
