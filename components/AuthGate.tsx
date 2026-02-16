"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSupabaseAuth } from "@/lib/useSupabaseAuth";

export function AuthGate() {
  const { isSupabaseConfigured, user, loading, error, signInWithEmail } = useSupabaseAuth();
  const [skipGate, setSkipGate] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentMsg, setSentMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSkipGate(window.sessionStorage.getItem("wobushizi:skip_auth_gate") === "1");
    }
    setHydrated(true);
  }, []);

  if (!hydrated) return null;
  if (!isSupabaseConfigured || user || skipGate) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-5 shadow-card">
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
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.sessionStorage.setItem("wobushizi:skip_auth_gate", "1");
            }
            setSkipGate(true);
          }}
          className="mt-3 text-xs text-stone-600 underline hover:text-stone-800"
        >
          No thanks, just poking around
        </button>
        {sentMsg ? <p className="mt-2 text-sm text-emerald-700">{sentMsg}</p> : null}
        {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
      </div>
    </div>
  );
}
