"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { BankQuickNav } from "@/components/BankQuickNav";
import { CharacterTable } from "@/components/CharacterTable";
import { Logo } from "@/components/Logo";
import { Milestone1000Modal } from "@/components/Milestone1000Modal";
import { Milestone2500Modal } from "@/components/Milestone2500Modal";
import { Milestone500Modal } from "@/components/Milestone500Modal";
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
import { useMilestone1000, useMilestone2500, useMilestone500 } from "@/lib/useMilestone500";

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
  const [pendingMoves, setPendingMoves] = useState<Set<string>>(new Set());
  const { showMilestone, dismissMilestone } = useMilestone500(knownCount);
  const { showMilestone: showMilestone1000, dismissMilestone: dismissMilestone1000 } =
    useMilestone1000(knownCount);
  const { showMilestone: showMilestone2500, dismissMilestone: dismissMilestone2500 } =
    useMilestone2500(knownCount);

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
    if (pendingMoves.has(character)) return;
    setMessage(null);
    setPendingMoves((prev) => new Set(prev).add(character));

    try {
      await setCharacterStatusLocal(character, status);

      // First flip the switch in place so the user can see the state change.
      setTabData((prev) => ({
        known: prev.known.map((row) => (row.character === character ? { ...row, status } : row)),
        study: prev.study.map((row) => (row.character === character ? { ...row, status } : row))
      }));

      // Keep it visible briefly, then move it out of the current list.
      await new Promise((resolve) => setTimeout(resolve, 420));

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
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update status.";
      setMessage(msg);

      // Restore canonical state if optimistic update path failed.
      const [knownRows, studyRows, count] = await Promise.all([
        fetchCharacterStatesByStatusLocal("known"),
        fetchCharacterStatesByStatusLocal("study"),
        fetchKnownCountLocal()
      ]);
      setTabData({ known: enrichRows(knownRows), study: enrichRows(studyRows) });
      setKnownCount(count);
    } finally {
      setPendingMoves((prev) => {
        const next = new Set(prev);
        next.delete(character);
        return next;
      });
    }
  }

  return (
    <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-4 sm:px-6 sm:py-6 md:py-4">
      <AuthGate />
      <Milestone500Modal open={showMilestone} onClose={dismissMilestone} />
      <Milestone1000Modal open={showMilestone1000} onClose={dismissMilestone1000} />
      <Milestone2500Modal open={showMilestone2500} onClose={dismissMilestone2500} />
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
      <p className="mt-2 text-center text-[11px] text-stone-500 md:hidden">
        You are in the mobile experience. For more features, please use desktop view.
      </p>

      {loading ? <p className="mt-6 text-center text-stone-600">Loading...</p> : null}

      {!loading ? (
        <section className="mx-auto mt-3 flex min-h-0 w-full max-w-4xl flex-1 flex-col overflow-hidden md:mt-6 md:flex-none md:overflow-visible">
          <div className="relative w-full">
            <p className="pointer-events-none absolute -top-4 right-2 z-20 text-xs leading-none text-stone-600">
              {currentRows.length.toLocaleString()} characters
            </p>
            <CharacterTable
              rows={currentRows}
              emptyMessage={activeTab === "character" ? "No known characters yet." : "Study queue is empty."}
              onSetKnown={(ch) => moveStatus(ch, "known")}
              onSetStudy={(ch) => moveStatus(ch, "study")}
              pendingCharacters={pendingMoves}
            />
          </div>

          {message ? <p className="mt-3 text-sm text-rose-700">{message}</p> : null}
        </section>
      ) : null}
    </main>
  );
}
