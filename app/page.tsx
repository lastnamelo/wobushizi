"use client";

import { CSSProperties, useEffect, useMemo, useState } from "react";
import { BankQuickNav } from "@/components/BankQuickNav";
import { Logo } from "@/components/Logo";
import { ProgressBar } from "@/components/ProgressBar";
import { TextLoader } from "@/components/TextLoader";
import { TopRightTextNav } from "@/components/TopRightTextNav";
import { extractUniqueChineseChars } from "@/lib/cjk";
import {
  applyLogLocal,
  ensureLocalProfile,
  fetchCharacterStatesForCharsLocal,
  fetchKnownCountLocal
} from "@/lib/localStore";
import { getHanziData, lookupHanziEntry } from "@/lib/hanzidb";
import { getHskColorValue } from "@/lib/hskStyles";
import { EnrichedCharacter } from "@/lib/types";

type HomeMode = "input" | "review" | "result";
type HskCounts = { 1: number; 2: number; 3: number; 4: number; 5: number; 6: number; unknown: number };

const totalHskCounts: HskCounts = (() => {
  const counts: HskCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, unknown: 0 };
  for (const row of getHanziData()) {
    const hsk = typeof row.hsk_level === "number" ? row.hsk_level : null;
    if (hsk && hsk >= 1 && hsk <= 6) counts[hsk as 1 | 2 | 3 | 4 | 5 | 6] += 1;
    else counts.unknown += 1;
  }
  return counts;
})();

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
  const [uniqueChars, setUniqueChars] = useState<string[]>([]);
  const [selectedSet, setSelectedSet] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [results, setResults] = useState<{
    newKnown: EnrichedCharacter[];
    queuedStudy: EnrichedCharacter[];
  } | null>(null);

  useEffect(() => {
    (async () => {
      await ensureLocalProfile();
      const count = await fetchKnownCountLocal();
      setKnownCount(count);
      setLoading(false);
    })().catch((err: Error) => {
      setMessage(err.message);
      setLoading(false);
    });
  }, []);

  const selectedCount = useMemo(() => selectedSet.size, [selectedSet]);
  const hskStats = useMemo(() => {
    const counts: HskCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, unknown: 0 };
    for (const ch of uniqueChars) {
      const hsk = lookupHanziEntry(ch)?.hsk_level;
      if (hsk && hsk >= 1 && hsk <= 6) counts[hsk as 1 | 2 | 3 | 4 | 5 | 6] += 1;
      else counts.unknown += 1;
    }
    return counts;
  }, [uniqueChars]);

  function resetToFreshInput() {
    setText("");
    setMode("input");
    setKnownSet(new Set());
    setUniqueChars([]);
    setSelectedSet(new Set());
    setResults(null);
    setMessage(null);
  }

  async function handleLoad() {
    setMessage(null);

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

  async function handleLog() {
    setIsSaving(true);
    setMessage(null);

    try {
      await applyLogLocal(text, uniqueChars, knownSet, selectedSet);

      const newKnown = uniqueChars
        .filter((ch) => !knownSet.has(ch) && selectedSet.has(ch))
        .map(enrich);
      const queuedStudy = uniqueChars
        .filter((ch) => !selectedSet.has(ch))
        .map(enrich);

      const dedupeByCharacter = (rows: EnrichedCharacter[]) => {
        const map = new Map<string, EnrichedCharacter>();
        for (const row of rows) {
          if (!map.has(row.character)) map.set(row.character, row);
        }
        return [...map.values()];
      };

      setResults({ newKnown: dedupeByCharacter(newKnown), queuedStudy: dedupeByCharacter(queuedStudy) });
      setMode("result");

      const count = await fetchKnownCountLocal();
      setKnownCount(count);
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="relative mx-auto min-h-screen max-w-5xl px-4 py-10 sm:px-6">
      <TopRightTextNav />
      <Logo />

      {loading ? <p className="mt-6 text-center text-stone-600">Loading...</p> : null}

      {!loading ? (
        <>
          <ProgressBar knownCount={knownCount} />
          <BankQuickNav active="home" />
          {mode === "review" && uniqueChars.length > 0 ? (
            <div className="mx-auto mt-8 max-w-4xl">
              <p className="mb-3 text-left text-lg text-stone-700">
                Deselect any character you do not recognize to add to study and select unhighlighted
                characters you would like to move to known.
              </p>
              <HskMiniPies stats={hskStats} />
            </div>
          ) : null}

          <section className="mx-auto mt-4 max-w-4xl space-y-4">
            {mode === "input" ? (
              <>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste Chinese text here..."
                  className="h-60 w-full rounded-2xl border border-line bg-white p-5 text-lg leading-8 outline-none shadow-card focus:border-stone-400"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleLoad}
                    className="rounded-xl bg-stone-800 px-5 py-2.5 text-sm text-white hover:bg-stone-700"
                  >
                    Load
                  </button>
                </div>
              </>
            ) : null}

            {mode === "review" ? (
              <>
                <TextLoader
                  text={text}
                  selected={selectedSet}
                  known={knownSet}
                  onToggle={toggleCharacter}
                />
                <p className="text-right text-sm text-stone-600">
                  Selected for logging: {selectedCount} / {uniqueChars.length}
                </p>
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
                <p className="text-lg text-stone-700">Log complete.</p>
                <div className="mx-auto max-w-4xl">
                  <HskMiniPies stats={hskStats} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
                    <h3 className="mb-3 text-base font-medium">New characters logged</h3>
                    <CharacterCloud rows={results.newKnown} empty="No new known characters in this event." />
                  </div>
                  <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
                    <h3 className="mb-3 text-base font-medium">Characters to study</h3>
                    <CharacterCloud rows={results.queuedStudy} empty="No study-queued characters in this event." />
                  </div>
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
        </>
      ) : null}
    </main>
  );
}

function CharacterCloud({ rows, empty }: { rows: EnrichedCharacter[]; empty: string }) {
  if (rows.length === 0) {
    return <p className="text-sm text-stone-500">{empty}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {rows.map((row) => (
        <span
          key={row.character}
          className="text-2xl"
          style={{ color: getHskColorValue(row.hsk_level) }}
          title={row.pinyin || "No pinyin"}
        >
          {row.character}
        </span>
      ))}
    </div>
  );
}

function pieSlicePath(percent: number): string {
  const clamped = Math.max(0, Math.min(percent, 100));
  if (clamped <= 0) return "";
  if (clamped >= 100) {
    // Full circle path split into two arcs for SVG compatibility.
    return "M 12 12 m -10 0 a 10 10 0 1 0 20 0 a 10 10 0 1 0 -20 0";
  }
  const angle = (clamped / 100) * 360;
  const rad = ((angle - 90) * Math.PI) / 180;
  const x = 12 + 10 * Math.cos(rad);
  const y = 12 + 10 * Math.sin(rad);
  const largeArc = angle > 180 ? 1 : 0;
  return `M 12 12 L 12 2 A 10 10 0 ${largeArc} 1 ${x} ${y} Z`;
}

function HskMiniPies({ stats }: { stats: HskCounts }) {
  const entries: Array<{ label: string; count: number; color: string }> = [
    { label: "HSK 1", count: stats[1], color: "var(--h1)" },
    { label: "HSK 2", count: stats[2], color: "var(--h2)" },
    { label: "HSK 3", count: stats[3], color: "var(--h3)" },
    { label: "HSK 4", count: stats[4], color: "var(--h4)" },
    { label: "HSK 5", count: stats[5], color: "var(--h5)" },
    { label: "HSK 6", count: stats[6], color: "var(--h6)" },
    { label: "Unknown", count: stats.unknown, color: "var(--h0)" }
  ];
  const sampleTotal = Math.max(
    stats[1] + stats[2] + stats[3] + stats[4] + stats[5] + stats[6] + stats.unknown,
    1
  );

  return (
    <div
      className="rounded-xl border border-line bg-white p-3 shadow-card"
      style={
        {
          "--h1": "#c41d0e",
          "--h2": "#15803d",
          "--h3": "#1d4ed8",
          "--h4": "#fa6f19",
          "--h5": "#8f7bbf",
          "--h6": "#f74f90",
          "--h0": "#6b7280"
        } as CSSProperties
      }
    >
      <div className="flex flex-wrap justify-center gap-5">
        {entries.map((entry) => {
          const pct = (entry.count / sampleTotal) * 100;
          const denominator =
            entry.label === "Unknown"
              ? totalHskCounts.unknown
              : totalHskCounts[Number(entry.label.replace("HSK ", "")) as 1 | 2 | 3 | 4 | 5 | 6];
          return (
            <div key={entry.label} className="flex items-center gap-2 text-xs leading-none text-stone-600">
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                className="block shrink-0 overflow-hidden rounded-full border border-stone-300"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" fill="#ddd6cc" />
                {pct > 0 ? <path d={pieSlicePath(pct)} fill={entry.color} /> : null}
              </svg>
              <span className="flex flex-col leading-tight" style={{ color: entry.color }}>
                <span>{entry.label}</span>
                <span>
                  ({entry.count}/{denominator})
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
