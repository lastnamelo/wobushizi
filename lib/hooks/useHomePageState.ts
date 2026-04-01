"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { extractUniqueChineseChars } from "@/lib/cjk";
import {
  applyLogLocal,
  ensureLocalProfile,
  fetchKnownCountLocal,
  fetchCharacterStatesByStatusLocal,
  fetchCharacterStatesForCharsLocal,
  isExpectedSignedOutError,
  setCharacterStatusLocal
} from "@/lib/localStore";
import { STARTER_PASSAGES, bumpStarterPassageIndex, getNextStarterPassageIndex } from "@/lib/starterPassages";
import { EnrichedCharacter } from "@/lib/types";
import { useMilestone1000, useMilestone2500, useMilestone500 } from "@/lib/useMilestone500";

export type HomeMode = "input" | "review" | "result";
export const MAX_INPUT_CHARS = 2000;

type HskStats = {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
  6: number;
  unknown: number;
};

const EMPTY_HSK_STATS: HskStats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, unknown: 0 };

let lookupHanziEntryFn:
  | ((character: string) => {
      character?: unknown;
      traditional_character?: unknown;
      alternate_characters?: unknown;
      pinyin?: unknown;
      pinyin_alternates?: unknown;
      hsk_level?: unknown;
      frequency?: unknown;
      definition?: unknown;
    } | undefined)
  | null = null;
let countHskLevelsFromCharactersFn: ((characters: string[]) => HskStats) | null = null;

async function getLookupHanziEntry() {
  if (!lookupHanziEntryFn) {
    const mod = await import("@/lib/hanzidb");
    lookupHanziEntryFn = mod.lookupHanziEntry;
  }
  return lookupHanziEntryFn;
}

async function getCountHskLevelsFromCharacters() {
  if (!countHskLevelsFromCharactersFn) {
    const mod = await import("@/lib/hskCounts");
    countHskLevelsFromCharactersFn = mod.countHskLevelsFromCharacters as (characters: string[]) => HskStats;
  }
  return countHskLevelsFromCharactersFn;
}

async function enrich(character: string): Promise<EnrichedCharacter> {
  const lookupHanziEntry = await getLookupHanziEntry();
  const meta = lookupHanziEntry(character);
  return {
    character: meta?.character ? String(meta.character) : character,
    traditional_character:
      meta?.traditional_character && meta.traditional_character !== character
        ? String(meta.traditional_character)
        : "",
    alternate_characters: typeof meta?.alternate_characters === "string" ? meta.alternate_characters : "",
    pinyin: meta?.pinyin ? String(meta.pinyin) : "",
    pinyin_alternates: typeof meta?.pinyin_alternates === "string" ? meta.pinyin_alternates : "",
    hsk_level: typeof meta?.hsk_level === "number" ? meta.hsk_level : null,
    frequency: typeof meta?.frequency === "number" ? meta.frequency : null,
    definition: meta?.definition ? String(meta.definition) : ""
  };
}

export function useHomePageState() {
  const [loading, setLoading] = useState(true);
  const [knownCount, setKnownCount] = useState(0);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<HomeMode>("input");
  const [knownSet, setKnownSet] = useState<Set<string>>(new Set());
  const [studySet, setStudySet] = useState<Set<string>>(new Set());
  const [hskStats, setHskStats] = useState<HskStats>(EMPTY_HSK_STATS);
  const [uniqueChars, setUniqueChars] = useState<string[]>([]);
  const [selectedSet, setSelectedSet] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingStarter, setIsLoadingStarter] = useState(false);
  const [showWordHints, setShowWordHints] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [results, setResults] = useState<{
    newKnown: EnrichedCharacter[];
    queuedStudy: EnrichedCharacter[];
  } | null>(null);
  const [detailState, setDetailState] = useState<{
    character: string;
    status?: "known" | "study";
    source: "known" | "study";
  } | null>(null);
  const { showMilestone, dismissMilestone } = useMilestone500(knownCount, !loading);
  const { showMilestone: showMilestone1000, dismissMilestone: dismissMilestone1000 } =
    useMilestone1000(knownCount, !loading);
  const { showMilestone: showMilestone2500, dismissMilestone: dismissMilestone2500 } =
    useMilestone2500(knownCount, !loading);

  const refreshKnownCount = useCallback(async () => {
    const count = await fetchKnownCountLocal();
    setKnownCount(count);
  }, []);

  const refreshKnownStats = useCallback(async () => {
    const knownRows = await fetchCharacterStatesByStatusLocal("known");
    const countHskLevelsFromCharacters = await getCountHskLevelsFromCharacters();
    setHskStats(countHskLevelsFromCharacters(knownRows.map((row) => row.character)));
  }, []);

  const refreshKnownSnapshot = useCallback(async (includeStats = true) => {
    await refreshKnownCount();
    if (includeStats) {
      await refreshKnownStats();
    }
  }, [refreshKnownCount, refreshKnownStats]);

  useEffect(() => {
    // Render shell immediately; hydrate counts/stats in background.
    setLoading(false);
    (async () => {
      await ensureLocalProfile();
      await refreshKnownSnapshot(false);
      refreshKnownStats().catch(() => {
        // Do not block the page if stats fail; count is the critical value.
      });
    })().catch((err: Error) => {
      if (!isExpectedSignedOutError(err)) {
        setMessage(err.message);
      }
    });
  }, [refreshKnownSnapshot, refreshKnownStats]);

  const selectedCount = useMemo(() => selectedSet.size, [selectedSet]);
  const newToYouCount = useMemo(
    () => uniqueChars.filter((ch) => !knownSet.has(ch) && !studySet.has(ch)).length,
    [uniqueChars, knownSet, studySet]
  );
  const knownInPassageCount = useMemo(() => uniqueChars.filter((ch) => knownSet.has(ch)).length, [uniqueChars, knownSet]);
  const toStudyCount = useMemo(() => uniqueChars.filter((ch) => !selectedSet.has(ch)).length, [uniqueChars, selectedSet]);
  const modalRows = useMemo(() => {
    if (!results || !detailState) return [];
    return detailState.source === "known" ? results.newKnown : results.queuedStudy;
  }, [detailState, results]);
  const detailIndex = useMemo(() => {
    if (!detailState) return -1;
    return modalRows.findIndex((row) => row.character === detailState.character);
  }, [detailState, modalRows]);

  function moveDetail(step: -1 | 1) {
    if (!detailState || detailIndex < 0) return;
    if (modalRows.length === 0) return;
    const nextIndex = (detailIndex + step + modalRows.length) % modalRows.length;
    const nextRow = modalRows[nextIndex];
    if (!nextRow) return;
    setDetailState({
      character: nextRow.character,
      status: nextRow.status,
      source: detailState.source
    });
  }

  function resetToFreshInput() {
    setText("");
    setMode("input");
    setKnownSet(new Set());
    setStudySet(new Set());
    setUniqueChars([]);
    setSelectedSet(new Set());
    setResults(null);
    setMessage(null);
    setNotice(null);
  }

  async function handleLoad() {
    setMessage(null);
    setNotice(null);

    try {
      const chars = extractUniqueChineseChars(text);
      if (chars.length === 0) {
        setMessage("No Chinese characters were found in the pasted text.");
        return;
      }

      const statesMap = await fetchCharacterStatesForCharsLocal(chars);
      const known = new Set<string>();
      const study = new Set<string>();

      for (const ch of chars) {
        const status = statesMap.get(ch)?.status;
        if (status === "known") {
          known.add(ch);
        } else if (status === "study") {
          study.add(ch);
        }
      }

      // Study entries start deselected; known/none start selected.
      const defaults = new Set(chars.filter((ch) => statesMap.get(ch)?.status !== "study"));

      setUniqueChars(chars);
      setKnownSet(known);
      setStudySet(study);
      setSelectedSet(defaults);
      setMode("review");
    } catch (err) {
      setMessage((err as Error).message);
    }
  }

  function toggleCharacter(character: string) {
    setSelectedSet((prev) => {
      const next = new Set(prev);
      if (next.has(character)) {
        next.delete(character);
      } else {
        next.add(character);
      }
      return next;
    });
  }

  async function handleLog() {
    setIsSaving(true);
    setMessage(null);

    try {
      await applyLogLocal(text, uniqueChars, knownSet, selectedSet);

      const newKnown = await Promise.all(
        uniqueChars
          .filter((ch) => !knownSet.has(ch) && selectedSet.has(ch))
          .map(async (ch) => ({ ...(await enrich(ch)), status: "known" as const }))
      );
      const queuedStudy = await Promise.all(
        uniqueChars
          .filter((ch) => !selectedSet.has(ch))
          .map(async (ch) => ({ ...(await enrich(ch)), status: "study" as const }))
      );

      const dedupeByCharacter = (list: EnrichedCharacter[]) => {
        const map = new Map<string, EnrichedCharacter>();
        for (const row of list) {
          if (!map.has(row.character)) map.set(row.character, row);
        }
        return [...map.values()];
      };

      setResults({ newKnown: dedupeByCharacter(newKnown), queuedStudy: dedupeByCharacter(queuedStudy) });
      setMode("result");

      await refreshKnownSnapshot();
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLoadStarterPassage() {
    setMessage(null);
    setNotice(null);
    setIsLoadingStarter(true);
    try {
      const idx = getNextStarterPassageIndex();
      const item = STARTER_PASSAGES[idx];
      const res = await fetch(item.path, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Could not load starter passage (${res.status}).`);
      }
      const body = await res.text();
      setText(body.trim());
      setMode("input");
      bumpStarterPassageIndex(idx);
      setNotice(item.title);
    } catch (err) {
      setMessage((err as Error).message || "Failed to load starter passage.");
    } finally {
      setIsLoadingStarter(false);
    }
  }

  function handleTextChange(next: string) {
    setText(next);
    if (next.length === 0) {
      setNotice(null);
    }
  }

  async function setDetailStatus(status: "known" | "study") {
    if (!detailState || !results) return;
    await setCharacterStatusLocal(detailState.character, status);
    await refreshKnownSnapshot();
    const detailEnriched = await enrich(detailState.character);

    setResults((prev) => {
      if (!prev || !detailState) return prev;
      const all = [
        ...prev.newKnown.map((r) => ({ ...r, status: "known" as const })),
        ...prev.queuedStudy.map((r) => ({ ...r, status: "study" as const }))
      ];
      const byChar = new Map(all.map((r) => [r.character, r]));
      const entry = byChar.get(detailState.character) ?? detailEnriched;
      byChar.set(detailState.character, { ...entry, status });
      const nextKnown = [...byChar.values()].filter((r) => r.status === "known");
      const nextStudy = [...byChar.values()].filter((r) => r.status === "study");
      return { newKnown: nextKnown, queuedStudy: nextStudy };
    });

    setDetailState((prev) => (prev ? { ...prev, status, source: status } : prev));
  }

  return {
    loading,
    knownCount,
    text,
    setText,
    handleTextChange,
    mode,
    setMode,
    knownSet,
    uniqueChars,
    selectedSet,
    isSaving,
    isLoadingStarter,
    showWordHints,
    setShowWordHints,
    message,
    notice,
    results,
    detailState,
    setDetailState,
    selectedCount,
    hskStats,
    newToYouCount,
    knownInPassageCount,
    toStudyCount,
    modalRows,
    detailIndex,
    showMilestone,
    dismissMilestone,
    showMilestone1000,
    dismissMilestone1000,
    showMilestone2500,
    dismissMilestone2500,
    resetToFreshInput,
    handleLoad,
    toggleCharacter,
    handleLog,
    handleLoadStarterPassage,
    moveDetail,
    setDetailStatus
  };
}
