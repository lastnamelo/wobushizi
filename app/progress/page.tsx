"use client";

import { useEffect, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { BankQuickNav } from "@/components/BankQuickNav";
import { DailyProgressChart } from "@/components/DailyProgressChart";
import { Logo } from "@/components/Logo";
import { ProgressBar } from "@/components/ProgressBar";
import { TopRightTextNav } from "@/components/TopRightTextNav";
import {
  ensureLocalProfile,
  fetchAllCharacterWordsLocal,
  fetchAllCharacterStatesLocal,
  fetchKnownCountLocal,
  isExpectedSignedOutError,
  resetLocalProgress,
} from "@/lib/localStore";

type DailyPoint = {
  day: string; // YYYY-MM-DD (local)
  count: number;
};

function toLocalDay(ts: string): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayPlusOne(day: string): string {
  const d = new Date(`${day}T00:00:00`);
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function todayLocalDay(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildCumulativeKnownSeries(
  knownRows: Array<{ created_at?: string; last_seen_at: string | null }>,
  currentKnown: number
): DailyPoint[] {
  const byDayNewKnown = new Map<string, number>();

  for (const row of knownRows) {
    const sourceTs = row.created_at ?? row.last_seen_at;
    if (!sourceTs) continue;
    const day = toLocalDay(sourceTs);
    byDayNewKnown.set(day, (byDayNewKnown.get(day) ?? 0) + 1);
  }

  const keys = [...byDayNewKnown.keys()].sort();
  if (keys.length === 0) {
    if (currentKnown <= 0) return [];
    return [{ day: todayLocalDay(), count: currentKnown }];
  }

  const series: DailyPoint[] = [];
  let running = 0;
  let cursor = keys[0];
  const last = keys[keys.length - 1];
  while (cursor <= last) {
    running += byDayNewKnown.get(cursor) ?? 0;
    series.push({ day: cursor, count: running });
    cursor = dayPlusOne(cursor);
  }
  return series;
}

export default function ProgressPage() {
  const [knownCount, setKnownCount] = useState(0);
  const [dailyPoints, setDailyPoints] = useState<DailyPoint[]>([]);
  const [avgWordsPerWeek, setAvgWordsPerWeek] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      await ensureLocalProfile();
      const [count, allStates, words] = await Promise.all([
        fetchKnownCountLocal(),
        fetchAllCharacterStatesLocal(),
        fetchAllCharacterWordsLocal()
      ]);
      setKnownCount(count);
      const knownRows = allStates.filter((row) => row.status === "known");
      setDailyPoints(buildCumulativeKnownSeries(knownRows, count));
      if (words.length === 0) {
        setAvgWordsPerWeek(0);
      } else {
        const first = words[0]?.created_at ? new Date(words[0].created_at) : new Date();
        const now = new Date();
        const diffMs = Math.max(1, now.getTime() - first.getTime());
        const weeks = Math.max(1, diffMs / (1000 * 60 * 60 * 24 * 7));
        setAvgWordsPerWeek(Math.round(words.length / weeks));
      }
      setLoading(false);
    })().catch((err: Error) => {
      if (!isExpectedSignedOutError(err)) {
        setMessage(err.message);
      }
      setLoading(false);
    });
  }, []);

  async function handleReset() {
    const ok = window.confirm("Reset all progress to 0? This will clear known/study, logs, and saved words.");
    if (!ok) return;
    await resetLocalProgress();
    setKnownCount(0);
    setDailyPoints([]);
    setAvgWordsPerWeek(0);
    setResetMsg("Progress reset to 0.");
  }

  return (
    <main className="relative mx-auto min-h-screen max-w-5xl px-4 py-6 sm:px-6 md:py-4">
      <AuthGate />
      <TopRightTextNav />

      <Logo />
      <ProgressBar knownCount={knownCount} />
      <BankQuickNav />

      <section className="mx-auto mt-3 w-full max-w-4xl md:mt-6">
        {loading ? <p className="mt-1 text-sm text-stone-600">Loading chart...</p> : null}

        {!loading && dailyPoints.length === 0 ? (
          <p className="mt-1 text-sm text-stone-600">
            No logged character history yet. Load a passage and log new characters to see progress.
          </p>
        ) : null}

        {!loading && dailyPoints.length > 0 ? (
          <div className="mt-1">
            <DailyProgressChart points={dailyPoints} />
          </div>
        ) : null}

        {!loading ? (
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-sm text-stone-600">Average words added per week: {avgWordsPerWeek}</p>
            <button
              onClick={handleReset}
              className="min-w-32 whitespace-nowrap rounded-xl bg-stone-900 px-5 py-2 text-sm text-white hover:bg-stone-800"
            >
              Reset Progress
            </button>
          </div>
        ) : null}
        {resetMsg ? <p className="mt-2 text-right text-sm text-stone-600">{resetMsg}</p> : null}

        {message ? <p className="mt-2 text-sm text-rose-700">{message}</p> : null}
      </section>
    </main>
  );
}
