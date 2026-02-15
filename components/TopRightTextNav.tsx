"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useSupabaseAuth } from "@/lib/useSupabaseAuth";

export function TopRightTextNav() {
  const { isSupabaseConfigured, user, loading, error, signInWithEmail } = useSupabaseAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [sentMsg, setSentMsg] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  async function handleLoginSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSentMsg(null);
    setAuthBusy(true);
    try {
      await signInWithEmail(email.trim());
      setSentMsg("Magic link sent.");
      setEmail("");
    } finally {
      setAuthBusy(false);
    }
  }

  useEffect(() => {
    function openLoginPanel() {
      setShowLogin(true);
    }

    window.addEventListener("wobushizi:open-login", openLoginPanel);
    return () => window.removeEventListener("wobushizi:open-login", openLoginPanel);
  }, []);

  return (
    <div className="absolute inset-x-0 top-3 z-30 sm:top-6">
      <div className="mx-auto flex w-full max-w-4xl justify-end px-4 sm:px-0">
        <div className="flex flex-col items-end gap-1 text-right text-sm text-stone-900">
        <Link href="/about" className="hover:underline">
          About
        </Link>
        <Link href="/contact" className="hover:underline">
          Contact
        </Link>
        {!user ? (
          <button
            onClick={() => {
              if (!isSupabaseConfigured) {
                setSentMsg("Login unavailable: Supabase env vars are missing.");
                return;
              }
              setShowLogin((prev) => !prev);
            }}
            disabled={authBusy || loading}
            className="text-sm text-stone-900 hover:underline disabled:opacity-60"
          >
            Login
          </button>
        ) : null}

        {!user && showLogin && isSupabaseConfigured ? (
          <form onSubmit={handleLoginSubmit} className="mt-1 w-52 rounded-xl border border-line bg-white p-2 shadow-card">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email for magic link"
              className="w-full rounded-lg border border-line bg-stone-50 px-2 py-1 text-xs outline-none focus:border-stone-400"
            />
            <button
              type="submit"
              disabled={authBusy}
              className="mt-2 w-full rounded-lg bg-stone-900 px-2 py-1 text-xs text-white hover:bg-stone-800 disabled:opacity-60"
            >
              {authBusy ? "Sending..." : "Send link"}
            </button>
            {sentMsg ? <p className="mt-1 text-left text-[11px] text-emerald-700">{sentMsg}</p> : null}
            {error ? <p className="mt-1 text-left text-[11px] text-rose-700">{error}</p> : null}
          </form>
        ) : null}
        {!showLogin && sentMsg && !user ? (
          <p className="mt-1 text-left text-[11px] text-stone-600">{sentMsg}</p>
        ) : null}
      </div>
      </div>
    </div>
  );
}
