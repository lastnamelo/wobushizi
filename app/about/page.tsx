"use client";

import { useEffect, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { BankQuickNav } from "@/components/BankQuickNav";
import { Logo } from "@/components/Logo";
import { ProgressBar } from "@/components/ProgressBar";
import { TopRightTextNav } from "@/components/TopRightTextNav";
import { ensureLocalProfile, fetchKnownCountLocal, resetLocalProgress } from "@/lib/localStore";

export default function AboutPage() {
  const [knownCount, setKnownCount] = useState(0);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      await ensureLocalProfile();
      const count = await fetchKnownCountLocal();
      setKnownCount(count);
    })();
  }, []);

  async function handleReset() {
    const ok = window.confirm("Reset all progress to 0? This will clear known/study and logs on this browser.");
    if (!ok) return;

    await resetLocalProgress();
    setKnownCount(0);
    setResetMsg("Progress reset to 0.");
  }

  return (
    <main className="relative mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-6">
      <AuthGate />
      <TopRightTextNav />

      <Logo />
      <ProgressBar knownCount={knownCount} />
      <BankQuickNav active="home" />

      <section className="mx-auto mt-3 rounded-2xl border border-line bg-white p-6 shadow-card md:mt-6">
        <h1 className="text-xl font-medium text-stone-800">About</h1>
        <p className="mt-3 leading-7 text-stone-700">
          我不识字 (&ldquo;I am illiterate&rdquo;) is a simple reading companion I built for myself as a
          Chinese learner.
        </p>
        <p className="mt-3 leading-7 text-stone-700">
          It is a place where you can paste a passage, quickly mark what you recognize, and keep a
          straightforward log over time.
        </p>
        <p className="mt-3 leading-7 text-stone-700">
          People say recognizing around 2,500 characters is enough to be considered &ldquo;literate.&rdquo;
          I&apos;ve always wondered how many characters I can actually recognize&mdash;but I never found an
          efficient way to track it, so I built one!
        </p>
        <p className="mt-3 leading-7 text-stone-700">
          In reality, Chinese literacy depends way more on words than individual characters. But character
          recognition feels like a simple and measurable starting point.
        </p>
        <p className="mt-3 leading-7 text-stone-700">
          This isn&apos;t meant to be an all-in-one Chinese study system. It&apos;s just a small tool to
          keep you accountable, show progress, and work toward the goal of claiming literacy.
        </p>
        <p className="mt-3 leading-7 text-stone-700">
          加油!
        </p>
      </section>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-left text-xs italic leading-none text-stone-600">
          This app was built with the help of Codex.
        </p>
        <button
          onClick={handleReset}
          className="rounded-xl bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-800"
        >
          Reset Progress
        </button>
      </div>
      {resetMsg ? <p className="mt-2 text-right text-sm text-stone-600">{resetMsg}</p> : null}
    </main>
  );
}
