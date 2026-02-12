"use client";

import { FormEvent, useState } from "react";

interface AuthPanelProps {
  loading: boolean;
  error: string | null;
  onSignIn: (email: string) => Promise<void>;
}

export function AuthPanel({ loading, error, onSignIn }: AuthPanelProps) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    await onSignIn(email.trim());
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-line bg-white p-6 text-center shadow-card">
      <h2 className="mb-3 text-lg text-stone-800">Sign in with email</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-line bg-stone-50 px-3 py-2 outline-none focus:border-stone-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-stone-800 px-4 py-2 text-white hover:bg-stone-700 disabled:opacity-60"
        >
          Send magic link
        </button>
      </form>
      {sent ? <p className="mt-3 text-sm text-stone-600">Check your inbox for the sign-in link.</p> : null}
      {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
