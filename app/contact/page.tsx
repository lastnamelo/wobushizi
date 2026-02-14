"use client";

import { useEffect, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { BankQuickNav } from "@/components/BankQuickNav";
import { Logo } from "@/components/Logo";
import { ProgressBar } from "@/components/ProgressBar";
import { TopRightTextNav } from "@/components/TopRightTextNav";
import { ensureLocalProfile, fetchKnownCountLocal } from "@/lib/localStore";

export default function ContactPage() {
  const [knownCount, setKnownCount] = useState(0);

  useEffect(() => {
    (async () => {
      await ensureLocalProfile();
      const count = await fetchKnownCountLocal();
      setKnownCount(count);
    })();
  }, []);

  return (
    <main className="relative mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-6">
      <AuthGate />
      <TopRightTextNav />

      <Logo />
      <ProgressBar knownCount={knownCount} />
      <BankQuickNav active="home" />

      <section className="mx-auto mt-3 rounded-2xl border border-line bg-white p-6 shadow-card md:mt-6">
        <h1 className="text-xl font-medium text-stone-800">Contact</h1>
        <p className="mt-3 leading-7 text-stone-700">
          Questions, feedback, and feature ideas are always welcome.
        </p>
        <p className="mt-2 leading-7 text-stone-700">
          If you notice missing entries, variant-character issues, or pinyin/definition mismatches, data
          patches for the Master List are especially welcome.
        </p>
        <p className="mt-2 leading-7 text-stone-700">
          Email:{" "}
          <a className="underline" href="mailto:hello@wobushizi.com">
            hello@wobushizi.com
          </a>
        </p>
        <p className="mt-2 leading-7 text-stone-700">
          If this project has been helpful to you and you&apos;d like to support keeping it alive (domain,
          hosting, etc.) you can{" "}
          <a
            className="underline"
            href="https://buymeacoffee.com/lastnamelo"
            target="_blank"
            rel="noreferrer"
          >
            buy me a coffee
          </a>
          .
        </p>
        <p className="mt-2 leading-7 text-stone-700">
          This project is small, open, and evolving — thanks for being part of it.
        </p>
      </section>
    </main>
  );
}
