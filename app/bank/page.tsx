"use client";

import { useEffect, useMemo, useState } from "react";
import { BankQuickNav } from "@/components/BankQuickNav";
import { CharacterTable } from "@/components/CharacterTable";
import { Logo } from "@/components/Logo";
import { ProgressBar } from "@/components/ProgressBar";
import { TopRightTextNav } from "@/components/TopRightTextNav";
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
      character: meta?.character ? String(meta.character) : row.character,
      status: row.status,
      traditional_character:
        meta?.traditional_character && meta.traditional_character !== row.character
          ? String(meta.traditional_character)
          : "",
      alternate_characters: typeof meta?.alternate_characters === "string" ? meta.alternate_characters : "",
      pinyin: meta?.pinyin ? String(meta.pinyin) : "",
      pinyin_alternates: typeof meta?.pinyin_alternates === "string" ? meta.pinyin_alternates : "",
      hsk_level: typeof meta?.hsk_level === "number" ? meta.hsk_level : null,
      frequency: typeof meta?.frequency === "number" ? meta.frequency : null,
      definition: typeof meta?.definition === "string" ? meta.definition : ""
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
  const [activeTab, setActiveTab] = useState<"character" | "study">("character");

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "study") {
      setActiveTab("study");
    }
  }, []);

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
    <main className="relative mx-auto min-h-screen max-w-6xl px-4 py-10 sm:px-6">
      <TopRightTextNav />

      <Logo />
      <ProgressBar knownCount={knownCount} />
      <BankQuickNav
        active={activeTab}
        onSelectBankTab={(tab) => {
          setActiveTab(tab);
          window.history.replaceState(null, "", `/bank?tab=${tab}`);
        }}
      />
      <p className="mt-3 text-center text-xs text-stone-500 md:hidden">
        You are in the mobile experience. For definitions and traditional characters, use the desktop page.
      </p>

      {loading ? <p className="mt-6 text-center text-stone-600">Loading...</p> : null}

      {!loading ? (
        <section className="mt-6 text-center">
          <CharacterTable
            title={activeTab === "character" ? "Character Bank (Known)" : "Study Bank"}
            rows={currentRows}
            emptyMessage={activeTab === "character" ? "No known characters yet." : "Study queue is empty."}
            onSetKnown={(ch) => moveStatus(ch, "known")}
            onSetStudy={(ch) => moveStatus(ch, "study")}
          />

          {message ? <p className="mt-3 text-sm text-rose-700">{message}</p> : null}
        </section>
      ) : null}
    </main>
  );
}
