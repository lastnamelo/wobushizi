"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function AboutPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex justify-end gap-2 text-sm">
        <Link href="/" className="rounded-lg border border-line px-3 py-1.5 hover:bg-white">
          Home
        </Link>
        <Link href="/bank" className="rounded-lg border border-line px-3 py-1.5 hover:bg-white">
          Bank
        </Link>
        <Link href="/master" className="rounded-lg border border-line px-3 py-1.5 hover:bg-white">
          Master List
        </Link>
      </div>

      <Logo />

      <section className="mx-auto mt-8 rounded-2xl border border-line bg-white p-6 shadow-card">
        <h1 className="text-xl font-medium text-stone-800">About 我不识字</h1>
        <p className="mt-3 leading-7 text-stone-700">
          我不识字 is a simple reading companion for Chinese text. Paste a passage, quickly mark what you
          currently recognize, and keep a lightweight known/study bank as you learn over time.
        </p>
        <p className="mt-3 leading-7 text-stone-700">
          This current build runs in local demo mode. Character status is stored in your browser so you can
          iterate quickly on design and interaction before enabling full Supabase persistence.
        </p>
      </section>
    </main>
  );
}
