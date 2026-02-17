"use client";

import { useEffect, useRef, useState } from "react";

const MILESTONE_500_SEEN_KEY = "wobushizi:milestone_500_seen";
const MILESTONE_1000_SEEN_KEY = "wobushizi:milestone_1000_seen";
const MILESTONE_2500_SEEN_KEY = "wobushizi:milestone_2500_seen";

function useMilestoneThreshold(knownCount: number, threshold: number, storageKey: string, isReady = true) {
  const [showMilestone, setShowMilestone] = useState(false);
  const [isSeen, setIsSeen] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const previousCountRef = useRef<number | null>(null);
  const armedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem(storageKey) === "1";
    setIsSeen(seen);
    setInitialized(true);
  }, [storageKey]);

  useEffect(() => {
    if (!initialized || !isReady) return;

    if (!armedRef.current) {
      // Treat the first ready value as baseline to avoid triggering on initial hydration/login sync.
      previousCountRef.current = knownCount;
      armedRef.current = true;
      if (!isSeen && knownCount >= threshold && typeof window !== "undefined") {
        // If already past threshold before this browser saw it, mark as seen silently.
        window.localStorage.setItem(storageKey, "1");
        setIsSeen(true);
      }
      return;
    }
    const prev = previousCountRef.current;
    if (prev == null) return;

    if (!isSeen && prev < threshold && knownCount >= threshold) {
      setShowMilestone(true);
      setIsSeen(true);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, "1");
      }
    }

    previousCountRef.current = knownCount;
  }, [knownCount, initialized, isReady, isSeen, storageKey, threshold]);

  return {
    showMilestone,
    dismissMilestone: () => setShowMilestone(false)
  };
}

export function useMilestone500(knownCount: number, isReady = true) {
  return useMilestoneThreshold(knownCount, 500, MILESTONE_500_SEEN_KEY, isReady);
}

export function useMilestone1000(knownCount: number, isReady = true) {
  return useMilestoneThreshold(knownCount, 1000, MILESTONE_1000_SEEN_KEY, isReady);
}

export function useMilestone2500(knownCount: number, isReady = true) {
  return useMilestoneThreshold(knownCount, 2500, MILESTONE_2500_SEEN_KEY, isReady);
}
