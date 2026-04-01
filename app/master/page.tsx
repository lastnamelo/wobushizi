"use client";

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
import { useMasterPageState } from "@/lib/hooks/useMasterPageState";

export default function MasterPage() {
  const {
    loading,
    knownCount,
    visibleCount,
    setVisibleCount,
    rows,
    knownStats,
    message,
    pendingMoves,
    showMilestone,
    dismissMilestone,
    showMilestone1000,
    dismissMilestone1000,
    showMilestone2500,
    dismissMilestone2500,
    setStatus
  } = useMasterPageState();

  return (
    <main className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 sm:py-6 md:py-4">
      <AuthGate />
      <Milestone500Modal open={showMilestone} onClose={dismissMilestone} />
      <Milestone1000Modal open={showMilestone1000} onClose={dismissMilestone1000} />
      <Milestone2500Modal open={showMilestone2500} onClose={dismissMilestone2500} />
      <TopRightTextNav />

      <Logo />
      <ProgressBar knownCount={knownCount} />
      <BankQuickNav active="master" />
      <p className="mt-2 text-center text-[11px] text-stone-500 md:hidden">
        You are in the mobile experience. For more features, use desktop view.
      </p>
      <div className="mx-auto mt-5 hidden w-full max-w-4xl md:block">
        <HskMiniPies stats={knownStats} />
      </div>

      {loading ? <p className="mt-6 text-center text-stone-600">Loading...</p> : null}

      {!loading ? (
        <div className="mx-auto mt-3 w-full max-w-4xl md:mt-6">
          <div className="w-full">
            <p className="mb-1 hidden text-right text-xs leading-none text-stone-600 md:block">
              {visibleCount.toLocaleString()} characters
            </p>
            <CharacterTable
              rows={rows}
              emptyMessage="No characters found."
              onSetKnown={(ch) => setStatus(ch, "known")}
              onSetStudy={(ch) => setStatus(ch, "study")}
              pendingCharacters={pendingMoves}
              defaultSortBy="frequency_rank_asc"
              helperText="Click any character to view definitions and more."
              hideHelperOnMobile
              statusFilterOptions={["all", "known", "none"]}
              defaultStatusFilter="all"
              hideUnknownHskByDefault
              onFilteredCountChange={setVisibleCount}
            />

            {message ? <p className="mt-2 text-sm text-rose-700">{message}</p> : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}
