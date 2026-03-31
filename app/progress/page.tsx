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
  fetchKnownCountLocal,
  fetchLogEventsLocal,
  isExpectedSignedOutError,
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

function buildDailyKnownSeries(
  logEvents: Awaited<ReturnType<typeof fetchLogEventsLocal>>,
  currentKnown: number
): DailyPoint[] {
  const byDayNet = new Map<string, number>();
  const activityDays = new Set<string>();
  for (const event of logEvents) {
    activityDays.add(toLocalDay(event.created_at));
    for (const item of event.items) {
      const day = toLocalDay(item.created_at);
      activityDays.add(day);
      const delta =
        item.action === "logged_known" ? 1 : item.action === "queued_study" ? -1 : 0;
      if (delta !== 0) {
        byDayNet.set(day, (byDayNet.get(day) ?? 0) + delta);
      }
    }
  }

  const keys = [...activityDays].sort();
  if (keys.length === 0) {
    if (currentKnown <= 0) return [];
    return [{ day: todayLocalDay(), count: currentKnown }];
  }

  const totalNet = [...byDayNet.values()].reduce((sum, v) => sum + v, 0);
  let running = currentKnown - totalNet;

  const series: DailyPoint[] = [];
  let cursor = keys[0];
  const last = keys[keys.length - 1];
  while (cursor <= last) {
    running += byDayNet.get(cursor) ?? 0;
    series.push({ day: cursor, count: Math.max(0, running) });
    cursor = dayPlusOne(cursor);
  }
  return series;
}

export default function ProgressPage() {
  const [knownCount, setKnownCount] = useState(0);
  const [dailyPoints, setDailyPoints] = useState<DailyPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      await ensureLocalProfile();
      const [count, logEvents] = await Promise.all([fetchKnownCountLocal(), fetchLogEventsLocal()]);
      setKnownCount(count);
      setDailyPoints(buildDailyKnownSeries(logEvents, count));
      setLoading(false);
    })().catch((err: Error) => {
      if (!isExpectedSignedOutError(err)) {
        setMessage(err.message);
      }
      setLoading(false);
    });
  }, []);

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

        {message ? <p className="mt-2 text-sm text-rose-700">{message}</p> : null}
      </section>
    </main>
  );
}
