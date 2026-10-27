"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { BankQuickNav } from "@/components/BankQuickNav";
import { CharacterTable } from "@/components/CharacterTable";
import { HskMiniPies } from "@/components/HskMiniPies";
import { Logo } from "@/components/Logo";
import { Milestone1000Modal } from "@/components/Milestone1000Modal";
import { Milestone2500Modal } from "@/components/Milestone2500Modal";
import { Milestone500Modal } from "@/components/Milestone500Modal";
import { ProgressBar } from "@/components/ProgressBar";
import { TopRightTextNav } from "@/components/TopRightTextNav";
import {
  ensureLocalProfile,
  fetchAllCharacterStatesLocal,
  fetchCharacterStatesForCharsLocal,
  isExpectedSignedOutError,
  setCharacterStatusLocal
} from "@/lib/localStore";
import { getCanonicalCharacter, lookupHanziEntry } from "@/lib/hanzidb";
import { countHskLevelsFromCharacters } from "@/lib/hskCounts";
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
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"character" | "study">("character");
  const [pendingMoves, setPendingMoves] = useState<Set<string>>(new Set());
  const { showMilestone, dismissMilestone } = useMilestone500(knownCount, !loading);
  const { showMilestone: showMilestone1000, dismissMilestone: dismissMilestone1000 } =
    useMilestone1000(knownCount, !loading);
  const { showMilestone: showMilestone2500, dismissMilestone: dismissMilestone2500 } =
    useMilestone2500(knownCount, !loading);

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "study") {
      setActiveTab("study");
    }
  }, []);

  useEffect(() => {
    (async () => {
      await ensureLocalProfile();
      const allRows = await fetchAllCharacterStatesLocal();
      const knownRows = allRows.filter((row) => row.status === "known");
      const studyRows = allRows.filter((row) => row.status === "study");
      setTabData({ known: enrichRows(knownRows), study: enrichRows(studyRows) });
      setKnownCount(knownRows.length);
      setLoading(false);
    })().catch((err: Error) => {
      if (!isExpectedSignedOutError(err)) {
        setMessage(err.message);
      }
      setLoading(false);
    });
  }, []);

  const currentRows = useMemo(
    () => (activeTab === "character" ? tabData.known : tabData.study),
    [activeTab, tabData]
  );
  const knownStats = useMemo(
    () => countHskLevelsFromCharacters(tabData.known.map((row) => row.character)),
    [tabData.known]
  );

  const studyExportRows = useMemo(
    () => [...tabData.study].sort((a, b) =>
      (a.hsk_level ?? Infinity) - (b.hsk_level ?? Infinity) ||
      (a.frequency ?? Infinity) - (b.frequency ?? Infinity) ||
      a.character.localeCompare(b.character, "zh-Hans-CN")
    ),
    [tabData.study]
  );

  function exportStudyList() {
    // Quote every cell and neutralize formula prefixes for spreadsheet imports.
    const csvCell = (value: string) => {
      const safe = /^[\s]*[=+@-]/.test(value) ? `'${value}` : value;
      return `"${safe.replace(/"/g, '""')}"`;
    };
    const rows = [
      ["Character", "Pinyin", "Definition"],
      ...studyExportRows.map((row) => [
        row.character,
        [row.pinyin, ...(row.pinyin_alternates ?? "").split("|")]
          .map((value) => value?.trim()).filter(Boolean).join(" / "),
        row.definition ?? ""
      ])
    ];
    // The BOM helps Excel recognize Chinese text as UTF-8.
    const blob = new Blob(["\uFEFF", rows.map((row) => row.map(csvCell).join(",")).join("\r\n")], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wobushizi-study-list-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setExportMessage("Study list downloaded.");
  }

  async function copyBankCharacters() {
    const characters = [...new Set(
      [...tabData.known, ...studyExportRows].map((row) => row.character)
    )];
    try {
      await navigator.clipboard.writeText(characters.join("\n"));
      setExportMessage(`${characters.length} known and study characters copied.`);
    } catch {
      setExportMessage("Could not copy. Please allow clipboard access and try again.");
    }
  }

  async function moveStatus(character: string, status: "known" | "study") {
    const canonical = getCanonicalCharacter(character);
    if (pendingMoves.has(canonical)) return;
    setMessage(null);
    setPendingMoves((prev) => new Set(prev).add(canonical));

    try {
      await setCharacterStatusLocal(canonical, status);
      // Match master behavior: verify write before applying refreshed view state.
      const verify = await fetchCharacterStatesForCharsLocal([canonical]);
      const persisted = verify.get(canonical)?.status;
      if (persisted !== status) {
        throw new Error("Update did not persist. Please refresh and sign in again.");
      }
      const allRows = await fetchAllCharacterStatesLocal();
      const knownRows = allRows.filter((row) => row.status === "known");
      const studyRows = allRows.filter((row) => row.status === "study");
      setTabData({ known: enrichRows(knownRows), study: enrichRows(studyRows) });
      setKnownCount(knownRows.length);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update status.";
      if (!isExpectedSignedOutError(err)) {
        setMessage(msg);
      }

      // Restore canonical state if optimistic update path failed.
      const allRows = await fetchAllCharacterStatesLocal();
      const knownRows = allRows.filter((row) => row.status === "known");
      const studyRows = allRows.filter((row) => row.status === "study");
      setTabData({ known: enrichRows(knownRows), study: enrichRows(studyRows) });
      setKnownCount(knownRows.length);
    } finally {
      setPendingMoves((prev) => {
        const next = new Set(prev);
        next.delete(canonical);
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
          setExportMessage(null);
          window.history.replaceState(null, "", `/bank?tab=${tab}`);
        }}
      />
      <p className="mt-2 text-center text-[11px] text-stone-500 md:hidden">
        You are in the mobile experience. For more features, use desktop view.
      </p>
      <div className="mx-auto mt-5 hidden w-full max-w-4xl md:block">
        <HskMiniPies stats={knownStats} />
      </div>

      {loading ? <p className="mt-6 text-center text-stone-600">Loading...</p> : null}

      {!loading ? (
        <section className="mx-auto mt-3 w-full max-w-4xl md:mt-6">
          <div className="w-full">
            <p className="mb-1 hidden text-right text-xs leading-none text-stone-600 md:block">
              {currentRows.length.toLocaleString()} characters
            </p>
            <CharacterTable
              key={activeTab}
              rows={currentRows}
              emptyMessage={activeTab === "character" ? "No known characters yet." : "Study queue is empty."}
              onSetKnown={(ch) => moveStatus(ch, "known")}
              onSetStudy={(ch) => moveStatus(ch, "study")}
              pendingCharacters={pendingMoves}
              toggleDelayMs={80}
              defaultSortBy={activeTab === "study" ? "hsk" : "frequency_rank_asc"}
              helperText="Click any character to view definitions and more."
              hideHelperOnMobile
              studyActions={(
                <>
                  {activeTab === "study" ? (
                  <button type="button" onClick={exportStudyList} disabled={studyExportRows.length === 0}
                    className="hover:underline disabled:opacity-40">
                    Export study CSV
                  </button>
                  ) : null}
                  <button type="button" onClick={copyBankCharacters} disabled={tabData.known.length + tabData.study.length === 0}
                    className="hover:underline disabled:opacity-40">
                    Copy to clipboard
                  </button>
                </>
              )}
            />
            <p role="status" className="mt-1 text-center text-xs text-stone-600">{exportMessage}</p>
          </div>

          {message ? <p className="mt-3 text-sm text-rose-700">{message}</p> : null}
        </section>
      ) : null}
    </main>
  );
}
