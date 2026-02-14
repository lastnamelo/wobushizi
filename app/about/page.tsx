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
          我不识字 (&ldquo;I am illiterate&rdquo;) is a simple reading companion for Chinese
          learners. Paste a passage, quickly mark what you recognize, and keep a lightweight Known/Study
          bank as you learn over time.
        </p>
        <p className="mt-3 leading-7 text-stone-700">
          A common benchmark is that recognizing about 2,500 characters is enough to be considered
          &ldquo;literate.&rdquo; I&apos;ve always been curious how many characters I can actually recognize,
          but I never found a simple way to track it efficiently.
        </p>
        <p className="mt-3 leading-7 text-stone-700">
          In reality, Chinese literacy depends more on words than individual characters. Still, character
          recognition is a practical place to start, and being able to pronounce characters is a major
          hurdle.
        </p>
        <p className="mt-3 leading-7 text-stone-700">
          This isn&apos;t meant to be an all-inclusive Chinese study tool. It&apos;s a lightweight tracker
          designed to help you stay motivated, keep learning new characters, and work toward that literacy
          benchmark. 加油！
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
