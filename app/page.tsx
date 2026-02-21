"use client";

import { useEffect, useMemo, useState } from "react";
import { BankQuickNav } from "@/components/BankQuickNav";
import { AuthGate } from "@/components/AuthGate";
import { CharacterDetailModal } from "@/components/CharacterDetailModal";
import { HskMiniPies } from "@/components/HskMiniPies";
import { Logo } from "@/components/Logo";
import { Milestone1000Modal } from "@/components/Milestone1000Modal";
import { Milestone2500Modal } from "@/components/Milestone2500Modal";
import { Milestone500Modal } from "@/components/Milestone500Modal";
import { ProgressBar } from "@/components/ProgressBar";
import { TextLoader } from "@/components/TextLoader";
import { TopRightTextNav } from "@/components/TopRightTextNav";
import { extractUniqueChineseChars } from "@/lib/cjk";
import {
  applyLogLocal,
  ensureLocalProfile,
  fetchCharacterStatesByStatusLocal,
  fetchCharacterStatesForCharsLocal,
  fetchKnownCountLocal,
  setCharacterStatusLocal
} from "@/lib/localStore";
import { lookupHanziEntry } from "@/lib/hanzidb";
import { countHskLevels } from "@/lib/hskCounts";
import { getHskColorValue } from "@/lib/hskStyles";
import { STARTER_PASSAGES, bumpStarterPassageIndex, getNextStarterPassageIndex } from "@/lib/starterPassages";
import { EnrichedCharacter } from "@/lib/types";
import { useIsCoarsePointer } from "@/lib/useIsCoarsePointer";
import { useMilestone1000, useMilestone2500, useMilestone500 } from "@/lib/useMilestone500";

type HomeMode = "input" | "review" | "result";
const MAX_INPUT_CHARS = 2000;

function enrich(character: string): EnrichedCharacter {
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

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [knownCount, setKnownCount] = useState(0);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<HomeMode>("input");
  const [knownSet, setKnownSet] = useState<Set<string>>(new Set());
  const [knownCharsForPies, setKnownCharsForPies] = useState<string[]>([]);
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
  const isCoarsePointer = useIsCoarsePointer();
  const { showMilestone, dismissMilestone } = useMilestone500(knownCount, !loading);
  const { showMilestone: showMilestone1000, dismissMilestone: dismissMilestone1000 } =
    useMilestone1000(knownCount, !loading);
  const { showMilestone: showMilestone2500, dismissMilestone: dismissMilestone2500 } =
    useMilestone2500(knownCount, !loading);

  async function refreshKnownSnapshot() {
    const [count, knownRows] = await Promise.all([fetchKnownCountLocal(), fetchCharacterStatesByStatusLocal("known")]);
    setKnownCount(count);
    setKnownCharsForPies(knownRows.map((row) => row.character));
  }

  useEffect(() => {
    (async () => {
      await ensureLocalProfile();
      await refreshKnownSnapshot();
      setLoading(false);
    })().catch((err: Error) => {
      setMessage(err.message);
      setLoading(false);
    });
  }, []);

  const selectedCount = useMemo(() => selectedSet.size, [selectedSet]);
  const hskStats = useMemo(
    () => countHskLevels(knownCharsForPies.map((ch) => ({ hsk_level: lookupHanziEntry(ch)?.hsk_level }))),
    [knownCharsForPies]
  );
  const newToYouCount = useMemo(() => uniqueChars.filter((ch) => !knownSet.has(ch)).length, [uniqueChars, knownSet]);
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
    const nextIndex = detailIndex + step;
    if (nextIndex < 0 || nextIndex >= modalRows.length) return;
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

      for (const ch of chars) {
        if (statesMap.get(ch)?.status === "known") {
          known.add(ch);
        }
      }

      // Study entries start deselected; known/none start selected.
      const defaults = new Set(chars.filter((ch) => statesMap.get(ch)?.status !== "study"));

      setUniqueChars(chars);
      setKnownSet(known);
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

  async function runLogFlow() {
    setIsSaving(true);
    setMessage(null);

    try {
      await applyLogLocal(text, uniqueChars, knownSet, selectedSet);

      const newKnown = uniqueChars
        .filter((ch) => !knownSet.has(ch) && selectedSet.has(ch))
        .map((ch) => ({ ...enrich(ch), status: "known" as const }));
      const queuedStudy = uniqueChars
        .filter((ch) => !selectedSet.has(ch))
        .map((ch) => ({ ...enrich(ch), status: "study" as const }));

      const dedupeByCharacter = (rows: EnrichedCharacter[]) => {
        const map = new Map<string, EnrichedCharacter>();
        for (const row of rows) {
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

  async function handleLog() {
    await runLogFlow();
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

  return (
    <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 sm:px-6 md:py-4">
      <AuthGate />
      <Milestone500Modal open={showMilestone} onClose={dismissMilestone} />
      <Milestone1000Modal open={showMilestone1000} onClose={dismissMilestone1000} />
      <Milestone2500Modal open={showMilestone2500} onClose={dismissMilestone2500} />
      <TopRightTextNav />
      <Logo onHomeClick={resetToFreshInput} />

      {loading ? <p className="mt-6 text-center text-stone-600">Loading...</p> : null}

      {!loading ? (
        <>
          <ProgressBar knownCount={knownCount} />
          <BankQuickNav active="home" />
          {mode === "review" && uniqueChars.length > 0 ? (
            <div className="mx-auto mt-4 mb-3 w-full max-w-4xl">
              <p className="w-full text-center text-xs text-stone-700 md:text-sm">
                Deselect characters you don&apos;t recognize to keep them in Study. Select unhighlighted
                characters to move them to Known.
              </p>
            </div>
          ) : null}

          <section
            className={`mx-auto w-full max-w-4xl ${
              mode === "review" ? "mt-1 flex min-h-0 flex-1 flex-col space-y-3" : "mt-4 space-y-3"
            }`}
          >
            {mode === "input" ? (
              <>
                <textarea
                  value={text}
                  onChange={(e) => {
                    const next = e.target.value;
                    setText(next);
                    if (next.length === 0) {
                      setNotice(null);
                    }
                  }}
                  placeholder="Paste Chinese text here (news article, short story, social post, or textbook paragraph)..."
                  maxLength={MAX_INPUT_CHARS}
                  className="h-52 w-full rounded-2xl border border-line bg-white p-5 text-base leading-7 outline-none shadow-card focus:border-stone-400 md:h-56"
                />
                <div className="flex items-start justify-between text-xs text-stone-600">
                  <p className="self-start leading-none">
                    {text.length}/{MAX_INPUT_CHARS}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setText("");
                        setNotice(null);
                        setMessage(null);
                      }}
                      className="rounded-xl border border-line px-4 py-2.5 text-sm text-stone-700 hover:bg-white"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleLoadStarterPassage}
                      disabled={isLoadingStarter}
                      className="rounded-xl border border-line px-4 py-2.5 text-sm text-stone-700 hover:bg-white disabled:opacity-60"
                    >
                      {isLoadingStarter ? "Loading..." : "Try a passage"}
                    </button>
                    <button
                      onClick={handleLoad}
                      className="rounded-xl bg-stone-800 px-5 py-2.5 text-sm text-white hover:bg-stone-700"
                    >
                      Load
                    </button>
                  </div>
                </div>
                {notice ? (
                  <div className="flex justify-end">
                    <p className="text-right text-sm text-stone-600">{notice}</p>
                  </div>
                ) : null}
              </>
            ) : null}

            {mode === "review" ? (
              <>
                <div className="flex items-center justify-between gap-3 text-[11px] text-stone-600 md:text-xs">
                  <p className="text-left">
                    {uniqueChars.length} unique characters, {newToYouCount} new to you.
                  </p>
                  <label className="inline-flex shrink-0 cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showWordHints}
                      onChange={(e) => setShowWordHints(e.target.checked)}
                      className="h-4 w-4 rounded border-line text-stone-700 focus:ring-stone-400"
                    />
                    Word hints
                  </label>
                </div>
                <TextLoader
                  text={text}
                  selected={selectedSet}
                  known={knownSet}
                  onToggle={toggleCharacter}
                  showWordHints={showWordHints}
                />
                <p className="text-right text-xs leading-none text-stone-600">
                  Selected now: {selectedCount} of {uniqueChars.length}
                </p>
                <div className="hidden md:block">
                  <HskMiniPies stats={hskStats} />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setMode("input")}
                    className="rounded-xl border border-line px-5 py-2.5 text-sm hover:bg-white"
                  >
                    Back
                  </button>
                  <button
                    disabled={isSaving}
                    onClick={handleLog}
                    className="rounded-xl bg-stone-800 px-5 py-2.5 text-sm text-white hover:bg-stone-700 disabled:opacity-60"
                  >
                    {isSaving ? "Logging..." : "Log"}
                  </button>
                </div>
              </>
            ) : null}

            {mode === "result" && results ? (
              <div className="space-y-4">
                <p className="text-center text-xs text-stone-600 md:text-sm">
                  Click any character to view definitions and more.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
                    <h3 className="mb-3 text-base font-medium">
                      New characters logged ({results.newKnown.length})
                    </h3>
                    <CharacterCloud
                      rows={results.newKnown}
                      empty="No new known characters in this event."
                      disableTitleTooltips={isCoarsePointer}
                      onPickCharacter={(character) => setDetailState({ character, status: "known", source: "known" })}
                    />
                  </div>
                  <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
                    <h3 className="mb-3 text-base font-medium">
                      Added to study ({results.queuedStudy.length})
                    </h3>
                    <CharacterCloud
                      rows={results.queuedStudy}
                      empty="No study-queued characters in this event."
                      disableTitleTooltips={isCoarsePointer}
                      onPickCharacter={(character) => setDetailState({ character, status: "study", source: "study" })}
                    />
                  </div>
                </div>

                <div className="hidden md:block">
                  <HskMiniPies stats={hskStats} />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setMode("review")}
                    className="rounded-xl border border-line px-5 py-2.5 text-sm hover:bg-white"
                  >
                    Back
                  </button>
                  <button
                    onClick={resetToFreshInput}
                    className="rounded-xl bg-stone-800 px-5 py-2.5 text-sm text-white hover:bg-stone-700"
                  >
                    Load another text
                  </button>
                </div>
              </div>
            ) : null}

            {message ? <p className="text-sm text-rose-700">{message}</p> : null}
          </section>

          <CharacterDetailModal
            character={detailState?.character ?? null}
            status={detailState?.status}
            onSetStatus={async (status) => {
              if (!detailState || !results) return;
              await setCharacterStatusLocal(detailState.character, status);
              await refreshKnownSnapshot();

              setResults((prev) => {
                if (!prev || !detailState) return prev;
                const all = [
                  ...prev.newKnown.map((r) => ({ ...r, status: "known" as const })),
                  ...prev.queuedStudy.map((r) => ({ ...r, status: "study" as const }))
                ];
                const byChar = new Map(all.map((r) => [r.character, r]));
                const entry = byChar.get(detailState.character) ?? enrich(detailState.character);
                byChar.set(detailState.character, { ...entry, status });
                const nextKnown = [...byChar.values()].filter((r) => r.status === "known");
                const nextStudy = [...byChar.values()].filter((r) => r.status === "study");
                return { newKnown: nextKnown, queuedStudy: nextStudy };
              });

              setDetailState((prev) => (prev ? { ...prev, status, source: status } : prev));
            }}
            onPrev={() => moveDetail(-1)}
            onNext={() => moveDetail(1)}
            canPrev={detailIndex > 0}
            canNext={detailIndex >= 0 && detailIndex < modalRows.length - 1}
            onClose={() => setDetailState(null)}
          />
        </>
      ) : null}
    </main>
  );
}

function CharacterCloud({
  rows,
  empty,
  disableTitleTooltips,
  onPickCharacter
}: {
  rows: EnrichedCharacter[];
  empty: string;
  disableTitleTooltips?: boolean;
  onPickCharacter: (character: string) => void;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-stone-500">{empty}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {rows.map((row) => (
        <button
          key={row.character}
          className="text-2xl"
          style={{ color: getHskColorValue(row.hsk_level) }}
          title={disableTitleTooltips ? undefined : row.pinyin || "No pinyin"}
          onClick={() => onPickCharacter(row.character)}
        >
          {row.character}
        </button>
      ))}
    </div>
  );
}
