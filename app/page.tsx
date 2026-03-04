"use client";

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
import { getHskColorValue } from "@/lib/hskStyles";
import { useHomePageState, MAX_INPUT_CHARS } from "@/lib/hooks/useHomePageState";
import { EnrichedCharacter } from "@/lib/types";
import { useDeviceCapabilities } from "@/lib/useDeviceCapabilities";

export default function HomePage() {
  const {
    loading,
    knownCount,
    text,
    handleTextChange,
    mode,
    setMode,
    knownSet,
    uniqueChars,
    selectedSet,
    isSaving,
    isLoadingStarter,
    showWordHints,
    setShowWordHints,
    message,
    notice,
    results,
    detailState,
    setDetailState,
    selectedCount,
    hskStats,
    newToYouCount,
    knownInPassageCount,
    toStudyCount,
    modalRows,
    detailIndex,
    showMilestone,
    dismissMilestone,
    showMilestone1000,
    dismissMilestone1000,
    showMilestone2500,
    dismissMilestone2500,
    resetToFreshInput,
    handleLoad,
    toggleCharacter,
    handleLog,
    handleLoadStarterPassage,
    moveDetail,
    setDetailStatus
  } = useHomePageState();
  const { isCoarsePointer } = useDeviceCapabilities();

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
                  onChange={(e) => handleTextChange(e.target.value)}
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
                      onClick={resetToFreshInput}
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
                    {uniqueChars.length} unique characters, {knownInPassageCount} known, {toStudyCount} to
                    study, {newToYouCount} new to you.
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
            onSetStatus={setDetailStatus}
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
