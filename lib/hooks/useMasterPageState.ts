"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ensureLocalProfile,
  fetchAllCharacterStatesLocal,
  fetchCharacterStatesForCharsLocal,
  setCharacterStatusLocal
} from "@/lib/localStore";
import { getCanonicalCharacter, getHanziData } from "@/lib/hanzidb";
import { countHskLevelsFromCharacters } from "@/lib/hskCounts";
import { CharacterStatus, EnrichedCharacter } from "@/lib/types";
import { useMilestone1000, useMilestone2500, useMilestone500 } from "@/lib/useMilestone500";

const allRows = getHanziData();

export function useMasterPageState() {
  const [loading, setLoading] = useState(true);
  const [knownCount, setKnownCount] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [stateMap, setStateMap] = useState<Map<string, CharacterStatus>>(new Map());
  const [message, setMessage] = useState<string | null>(null);
  const [pendingMoves, setPendingMoves] = useState<Set<string>>(new Set());
  const { showMilestone, dismissMilestone } = useMilestone500(knownCount, !loading);
  const { showMilestone: showMilestone1000, dismissMilestone: dismissMilestone1000 } =
    useMilestone1000(knownCount, !loading);
  const { showMilestone: showMilestone2500, dismissMilestone: dismissMilestone2500 } =
    useMilestone2500(knownCount, !loading);

  async function hydrateFromStore() {
    const states = await fetchAllCharacterStatesLocal();
    const map = new Map<string, CharacterStatus>();
    for (const row of states) {
      map.set(row.character, row.status);
    }
    setStateMap(map);
    setKnownCount(states.filter((row) => row.status === "known").length);
  }

  useEffect(() => {
    (async () => {
      await ensureLocalProfile();
      await hydrateFromStore();
      setLoading(false);
    })().catch((err: Error) => {
      setMessage(err.message);
      setLoading(false);
    });
  }, []);

  const rows = useMemo<EnrichedCharacter[]>(
    () =>
      allRows.map((row) => {
        const canonical = getCanonicalCharacter(row.character);
        const status = stateMap.get(canonical);
        return {
          character: canonical,
          status,
          traditional_character:
            row.traditional_character && row.traditional_character !== row.character
              ? String(row.traditional_character)
              : "",
          alternate_characters: typeof row.alternate_characters === "string" ? row.alternate_characters : "",
          pinyin: row.pinyin ? String(row.pinyin) : "",
          pinyin_alternates: typeof row.pinyin_alternates === "string" ? row.pinyin_alternates : "",
          hsk_level: typeof row.hsk_level === "number" ? row.hsk_level : null,
          frequency: typeof row.frequency === "number" ? row.frequency : null,
          definition: row.definition ? String(row.definition) : ""
        };
      }),
    [stateMap]
  );

  const knownStats = useMemo(
    () =>
      countHskLevelsFromCharacters(
        rows.filter((row) => row.status === "known").map((row) => row.character)
      ),
    [rows]
  );

  async function setStatus(character: string, status: CharacterStatus) {
    const canonical = getCanonicalCharacter(character);
    if (pendingMoves.has(canonical)) return;
    setMessage(null);
    setPendingMoves((prev) => new Set(prev).add(canonical));

    try {
      await setCharacterStatusLocal(canonical, status);
      // Verify persistence using the same path other pages read from.
      const verify = await fetchCharacterStatesForCharsLocal([canonical]);
      const persisted = verify.get(canonical)?.status;
      if (persisted !== status) {
        throw new Error("Update did not persist. Please refresh and sign in again.");
      }
      setStateMap((prev) => {
        const next = new Map(prev);
        next.set(canonical, status);
        return next;
      });
      const states = await fetchAllCharacterStatesLocal();
      setKnownCount(states.filter((row) => row.status === "known").length);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update status.";
      setMessage(msg);
    } finally {
      setPendingMoves((prev) => {
        const next = new Set(prev);
        next.delete(canonical);
        return next;
      });
    }
  }

  return {
    loading,
    knownCount,
    visibleCount,
    setVisibleCount,
    rows,
    knownStats,
    message,
    pendingMoves,
    showMilestone,
    dismissMilestone,
    showMilestone1000,
    dismissMilestone1000,
    showMilestone2500,
    dismissMilestone2500,
    setStatus
  };
}
