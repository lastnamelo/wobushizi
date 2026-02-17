"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSupabaseAuth } from "@/lib/useSupabaseAuth";

const TESTER_BYPASS_UNTIL_KEY = "wobushizi:tester_bypass_until";
const TESTER_BYPASS_HOURS = 24;

export function AuthGate() {
  const { isSupabaseConfigured, user, loading, error, signInWithEmail } = useSupabaseAuth();
  const [hydrated, setHydrated] = useState(false);
  const [testerBypassed, setTesterBypassed] = useState(false);
  const [testerTapCount, setTesterTapCount] = useState(0);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentMsg, setSentMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem(TESTER_BYPASS_UNTIL_KEY);
      const until = raw ? Number(raw) : Number.NaN;
      if (Number.isFinite(until) && until > Date.now()) {
        setTesterBypassed(true);
      }
    }
    setHydrated(true);
  }, []);

  if (!hydrated) return null;
  if (!isSupabaseConfigured || user || testerBypassed) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setSentMsg(null);
    try {
      await signInWithEmail(email.trim());
      setSentMsg("Magic link sent. Check your email.");
    } finally {
      setBusy(false);
    }
  }

  function onTesterBypassClick() {
    setTesterTapCount((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        const until = Date.now() + TESTER_BYPASS_HOURS * 60 * 60 * 1000;
        if (typeof window !== "undefined") {
          window.localStorage.setItem(TESTER_BYPASS_UNTIL_KEY, String(until));
        }
        setTesterBypassed(true);
        return 0;
      }
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-white p-5 shadow-card">
        <h2 className="text-base font-medium text-stone-900">Welcome to 我不识字</h2>
        <p className="mt-2 text-sm leading-6 text-stone-700">
          This app helps you track progress toward Chinese literacy one character at a time. Sign in with
          your email to save your progress and pick up where you left off.
        </p>
        <form onSubmit={onSubmit} className="mt-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email for magic link"
            className="w-full rounded-lg border border-line bg-stone-50 px-3 py-2 text-sm outline-none focus:border-stone-400"
          />
          <button
            type="submit"
            disabled={busy || loading}
            className="mt-3 w-full rounded-xl bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-800 disabled:opacity-60"
          >
            {busy ? "Sending..." : "Send magic link"}
          </button>
        </form>
        {sentMsg ? <p className="mt-2 text-sm text-emerald-700">{sentMsg}</p> : null}
        <p className="mt-2 text-xs text-stone-600">Tip: check spam/junk if the email doesn&apos;t show up.</p>
        {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
        <button
          type="button"
          onClick={onTesterBypassClick}
          className="absolute left-2 top-2 h-6 w-6 opacity-0"
          title="Tester bypass"
          aria-label="Tester bypass"
        />
      </div>
    </div>
  );
}
