"use client";

import Link from "next/link";
import { isTesterBypassEnabled, setTesterBypassEnabled } from "@/lib/localStore";
import { useSupabaseAuth } from "@/lib/useSupabaseAuth";

export function TopRightTextNav() {
  const { user, loading, signOut } = useSupabaseAuth();

  function openLogin() {
    if (isTesterBypassEnabled()) {
      setTesterBypassEnabled(false);
      window.location.reload();
      return;
    }
    window.location.reload();
  }

  async function onLogout() {
    const confirmed = window.confirm("Log out of 我不识字?");
    if (!confirmed) return;
    await signOut();
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-30 sm:top-6">
      <div className="mx-auto flex w-full max-w-4xl justify-end px-4 sm:px-0">
        <div className="pointer-events-auto flex flex-col items-end gap-1 text-right text-sm text-stone-900">
          <Link href="/about" className="hover:underline">
            About
          </Link>
          <Link href="/contact" className="hover:underline">
            Contact
          </Link>
          <Link href="/progress" className="hover:underline">
            Progress
          </Link>
          {!loading ? (
            user ? (
              <button type="button" onClick={onLogout} className="text-right hover:underline">
                Log out
              </button>
            ) : (
              <button type="button" onClick={openLogin} className="text-right hover:underline">
                Login
              </button>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
