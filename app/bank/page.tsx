"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CharacterTable } from "@/components/CharacterTable";
import { Logo } from "@/components/Logo";
import { Tabs } from "@/components/Tabs";
import {
  ensureLocalProfile,
  fetchCharacterStatesByStatusLocal,
  fetchKnownCountLocal,
  setCharacterStatusLocal
} from "@/lib/localStore";
import { lookupHanziEntry } from "@/lib/hanzidb";
import { CharacterStateRow, EnrichedCharacter } from "@/lib/types";

function enrichRows(rows: CharacterStateRow[]): EnrichedCharacter[] {
  return rows.map((row) => {
    const meta = lookupHanziEntry(row.character);
    return {
      character: row.character,
      status: row.status,
      traditional_character:
        meta?.traditional_character && meta.traditional_character !== row.character
          ? String(meta.traditional_character)
          : "",
      pinyin: meta?.pinyin ? String(meta.pinyin) : "",
      hsk_level: typeof meta?.hsk_level === "number" ? meta.hsk_level : null,
      frequency: typeof meta?.frequency === "number" ? meta.frequency : null
    };
  });
}

export default function BankPage() {
  const [loading, setLoading] = useState(true);
  const [tabData, setTabData] = useState<{ known: EnrichedCharacter[]; study: EnrichedCharacter[] }>({
    known: [],
    study: []
  });
  const [knownCount, setKnownCount] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") === "study" ? "study" : "character";
  const [activeTab, setActiveTab] = useState<"character" | "study">(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    (async () => {
      await ensureLocalProfile();
      const [knownRows, studyRows, count] = await Promise.all([
        fetchCharacterStatesByStatusLocal("known"),
        fetchCharacterStatesByStatusLocal("study"),
        fetchKnownCountLocal()
      ]);

      setTabData({ known: enrichRows(knownRows), study: enrichRows(studyRows) });
      setKnownCount(count);
      setLoading(false);
    })().catch((err: Error) => {
      setMessage(err.message);
      setLoading(false);
    });
  }, []);

  const currentRows = useMemo(
    () => (activeTab === "character" ? tabData.known : tabData.study),
    [activeTab, tabData]
  );

  async function moveStatus(character: string, status: "known" | "study") {
    await setCharacterStatusLocal(character, status);

    setTabData((prev) => {
      const from = status === "known" ? "study" : "known";
      const to = status === "known" ? "known" : "study";
      const found = prev[from].find((row) => row.character === character);
      const payload = found ?? enrichRows([{ user_id: "local-user", character, status, last_seen_at: null }])[0];

      return {
        known:
          to === "known"
            ? [...prev.known.filter((r) => r.character !== character), { ...payload, status: "known" }]
            : prev.known.filter((r) => r.character !== character),
        study:
          to === "study"
            ? [...prev.study.filter((r) => r.character !== character), { ...payload, status: "study" }]
            : prev.study.filter((r) => r.character !== character)
      };
    });

    const count = await fetchKnownCountLocal();
    setKnownCount(count);
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex justify-end gap-2 text-sm">
        <Link href="/about" className="rounded-lg border border-line px-3 py-1.5 hover:bg-white">
          About
        </Link>
        <Link href="/" className="rounded-lg border border-line px-3 py-1.5 hover:bg-white">
          Home
        </Link>
        <Link href="/master" className="rounded-lg border border-line px-3 py-1.5 hover:bg-white">
          Master List
        </Link>
      </div>

      <Logo />
      <p className="mt-3 text-center text-sm text-stone-600">Known {knownCount} / 2500</p>

      {loading ? <p className="mt-6 text-center text-stone-600">Loading...</p> : null}

      {!loading ? (
        <section className="mt-8 text-center">
          <Tabs
            current={activeTab}
            options={[
              { key: "character", label: "Character Bank" },
              { key: "study", label: "Study Bank" }
            ]}
            onChange={(tab) => {
              const next = tab === "study" ? "study" : "character";
              setActiveTab(next);
              router.replace(`/bank?tab=${next}`);
            }}
          />

          <CharacterTable
            title={activeTab === "character" ? "Character Bank (Known)" : "Study Bank"}
            rows={currentRows}
            emptyMessage={activeTab === "character" ? "No known characters yet." : "Study queue is empty."}
            onSetKnown={activeTab === "study" ? (ch) => moveStatus(ch, "known") : undefined}
            onSetStudy={activeTab === "character" ? (ch) => moveStatus(ch, "study") : undefined}
          />

          {message ? <p className="mt-3 text-sm text-rose-700">{message}</p> : null}
        </section>
      ) : null}
    </main>
  );
}
