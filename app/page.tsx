"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AuthPanel } from "@/components/AuthPanel";
import { Logo } from "@/components/Logo";
import { ProgressBar } from "@/components/ProgressBar";
import { TextLoader } from "@/components/TextLoader";
import { extractUniqueChineseChars } from "@/lib/cjk";
import {
  ensureProfile,
  fetchCharacterStatesForChars,
  fetchKnownCount
} from "@/lib/db";
import { getHanziMap } from "@/lib/hanzidb";
import { supabase } from "@/lib/supabaseClient";
import { EnrichedCharacter } from "@/lib/types";
import { useSupabaseAuth } from "@/lib/useSupabaseAuth";

type HomeMode = "input" | "review" | "result";

const hanziMap = getHanziMap();

function enrich(character: string): EnrichedCharacter {
  const meta = hanziMap.get(character);
  return {
    character,
    traditional_character:
      meta?.traditional_character && meta.traditional_character !== character
        ? String(meta.traditional_character)
        : "",
    pinyin: meta?.pinyin ? String(meta.pinyin) : "",
    hsk_level: typeof meta?.hsk_level === "number" ? meta.hsk_level : null,
    definition: meta?.definition ? String(meta.definition) : ""
  };
}

export default function HomePage() {
  const { user, loading, error, signInWithEmail, signOut } = useSupabaseAuth();
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
    if (!user) return;

    (async () => {
      await ensureProfile(supabase, user);
      const count = await fetchKnownCount(supabase, user.id);
      setKnownCount(count);
    })().catch((err: Error) => {
      setMessage(err.message);
    });
  }, [user]);

  const selectedCount = useMemo(() => selectedSet.size, [selectedSet]);

  async function handleLoad() {
    setMessage(null);
    if (!user) return;

    try {
      const chars = extractUniqueChineseChars(text);
      if (chars.length === 0) {
        setMessage("No Chinese characters were found in the pasted text.");
        return;
      }

      const statesMap = await fetchCharacterStatesForChars(supabase, user.id, chars);
      const known = new Set<string>();

      for (const ch of chars) {
        if (statesMap.get(ch)?.status === "known") {
          known.add(ch);
        }
      }

      // Default behavior: non-known unique characters are selected so logging is one click.
      const defaults = new Set(chars.filter((ch) => !known.has(ch)));

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
    if (!user) return;
    setIsSaving(true);
    setMessage(null);

    try {
      const now = new Date().toISOString();

      const { data: eventData, error: eventError } = await supabase
        .from("log_events")
        .insert({ user_id: user.id, source_text: text })
        .select("id")
        .single();

      if (eventError || !eventData) {
        throw eventError ?? new Error("Failed to create log event");
      }

      const upsertRows = uniqueChars.map((character) => {
        const alreadyKnown = knownSet.has(character);
        const status = alreadyKnown || selectedSet.has(character) ? "known" : "study";
        return {
          user_id: user.id,
          character,
          status,
          last_seen_at: now
        };
      });

      // Client-side Supabase cannot open explicit SQL transactions, so we bind writes
      // through one event id and consistent timestamps to keep event history coherent.
      const { error: upsertError } = await supabase
        .from("character_states")
        .upsert(upsertRows, { onConflict: "user_id,character" });

      if (upsertError) {
        throw upsertError;
      }

      const items = uniqueChars.map((character) => {
        const alreadyKnown = knownSet.has(character);
        const selected = selectedSet.has(character);
        const action = alreadyKnown
          ? "skipped"
          : selected
            ? "logged_known"
            : "queued_study";

        return {
          log_event_id: eventData.id,
          user_id: user.id,
          character,
          action,
          created_at: now
        };
      });

      const { error: itemsError } = await supabase.from("log_event_items").insert(items);
      if (itemsError) {
        throw itemsError;
      }

      const newKnown = uniqueChars
        .filter((ch) => !knownSet.has(ch) && selectedSet.has(ch))
        .map(enrich);
      const queuedStudy = uniqueChars
        .filter((ch) => !knownSet.has(ch) && !selectedSet.has(ch))
        .map(enrich);

      setResults({ newKnown, queuedStudy });
      setMode("result");

      const count = await fetchKnownCount(supabase, user.id);
      setKnownCount(count);
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex justify-end gap-2 text-sm">
        <Link href="/bank" className="rounded-lg border border-line px-3 py-1.5 hover:bg-white">
          Bank
        </Link>
        <Link href="/master" className="rounded-lg border border-line px-3 py-1.5 hover:bg-white">
          Master List
        </Link>
        {user ? (
          <button className="rounded-lg border border-line px-3 py-1.5 hover:bg-white" onClick={signOut}>
            Sign out
          </button>
        ) : null}
      </div>

      <Logo />

      {loading ? <p className="mt-6 text-center text-stone-600">Loading...</p> : null}

      {!loading && !user ? (
        <div className="mt-8">
          <AuthPanel loading={false} error={error} onSignIn={signInWithEmail} />
        </div>
      ) : null}

      {!loading && user ? (
        <>
          <ProgressBar knownCount={knownCount} />

          <section className="mx-auto mt-8 max-w-4xl space-y-4">
            {mode === "input" ? (
              <>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste Chinese text here..."
                  className="h-60 w-full rounded-2xl border border-line bg-white p-5 text-lg leading-8 outline-none shadow-card focus:border-stone-400"
                />
                <button
                  onClick={handleLoad}
                  className="rounded-xl bg-stone-800 px-5 py-2.5 text-sm text-white hover:bg-stone-700"
                >
                  Load
                </button>
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
                <p className="text-sm text-stone-600">
                  Selected for logging: {selectedCount} / {uniqueChars.length}
                </p>
                <div className="flex gap-2">
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
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-stone-600">Log complete. Review this event below.</p>
                  <div className="flex gap-2">
                    <Link
                      href="/bank?tab=character"
                      className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-white"
                    >
                      View Character Bank
                    </Link>
                    <Link
                      href="/bank?tab=study"
                      className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-white"
                    >
                      View Study Bank
                    </Link>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
                    <h3 className="mb-3 text-base font-medium">New characters logged</h3>
                    <SimpleEventTable rows={results.newKnown} empty="No new known characters in this event." />
                  </div>
                  <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
                    <h3 className="mb-3 text-base font-medium">Characters to study</h3>
                    <SimpleEventTable rows={results.queuedStudy} empty="No study-queued characters in this event." />
                  </div>
                </div>

                <button
                  onClick={() => setMode("input")}
                  className="rounded-xl border border-line px-5 py-2.5 text-sm hover:bg-white"
                >
                  Load another text
                </button>
              </div>
            ) : null}

            {message ? <p className="text-sm text-rose-700">{message}</p> : null}
          </section>
        </>
      ) : null}
    </main>
  );
}

function SimpleEventTable({ rows, empty }: { rows: EnrichedCharacter[]; empty: string }) {
  if (rows.length === 0) {
    return <p className="text-sm text-stone-500">{empty}</p>;
  }

  return (
    <div className="table-scroll">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-stone-500">
            <th className="border-b border-line py-1.5">字</th>
            <th className="border-b border-line py-1.5">繁</th>
            <th className="border-b border-line py-1.5">Pinyin</th>
            <th className="border-b border-line py-1.5">HSK</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.character} className="border-b border-stone-100">
              <td className="py-1.5 text-lg">{row.character}</td>
              <td className="py-1.5">{row.traditional_character || "-"}</td>
              <td className="py-1.5">{row.pinyin || "-"}</td>
              <td className="py-1.5">{row.hsk_level ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
