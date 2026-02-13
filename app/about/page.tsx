"use client";

import { useEffect, useState } from "react";
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
      <TopRightTextNav />

      <Logo />
      <ProgressBar knownCount={knownCount} />
      <BankQuickNav active="home" />

      <section className="mx-auto mt-8 rounded-2xl border border-line bg-white p-6 shadow-card">
        <h1 className="text-xl font-medium text-stone-800">About 我不识字</h1>
        <p className="mt-3 leading-7 text-stone-700">
          我不识字 is a simple reading companion for Chinese text. Paste a passage, quickly mark what you
          currently recognize, and keep a lightweight known/study bank as you learn over time.
        </p>
        <p className="mt-3 leading-7 text-stone-700">
          The current demo build stores data in your browser so you can iterate quickly. Supabase-backed
          persistence can be toggled back on when you are ready.
        </p>
      </section>
      <div className="mt-5 text-center">
        <button
          onClick={handleReset}
          className="rounded-xl border border-line px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
        >
          Reset to 0
        </button>
        {resetMsg ? <p className="mt-2 text-sm text-stone-600">{resetMsg}</p> : null}
      </div>
    </main>
  );
}
