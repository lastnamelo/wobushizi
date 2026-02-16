"use client";

import { useEffect, useRef, useState } from "react";

const MILESTONE_500_SEEN_KEY = "wobushizi:milestone_500_seen";
const MILESTONE_1000_SEEN_KEY = "wobushizi:milestone_1000_seen";
const MILESTONE_2500_SEEN_KEY = "wobushizi:milestone_2500_seen";

function useMilestoneThreshold(knownCount: number, threshold: number, storageKey: string) {
  const [showMilestone, setShowMilestone] = useState(false);
  const [isSeen, setIsSeen] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const previousCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem(storageKey) === "1";
    setIsSeen(seen);
    setInitialized(true);
  }, [storageKey]);

  useEffect(() => {
    if (!initialized) return;

    const prev = previousCountRef.current;
    if (prev == null) {
      previousCountRef.current = knownCount;
      return;
    }

    if (!isSeen && prev < threshold && knownCount >= threshold) {
      setShowMilestone(true);
      setIsSeen(true);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, "1");
      }
    }

    previousCountRef.current = knownCount;
  }, [knownCount, initialized, isSeen, storageKey, threshold]);

  return {
    showMilestone,
    dismissMilestone: () => setShowMilestone(false)
  };
}

export function useMilestone500(knownCount: number) {
  return useMilestoneThreshold(knownCount, 500, MILESTONE_500_SEEN_KEY);
}

export function useMilestone1000(knownCount: number) {
  return useMilestoneThreshold(knownCount, 1000, MILESTONE_1000_SEEN_KEY);
}

export function useMilestone2500(knownCount: number) {
  return useMilestoneThreshold(knownCount, 2500, MILESTONE_2500_SEEN_KEY);
}
