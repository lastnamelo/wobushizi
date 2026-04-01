"use client";

import Link from "next/link";

export function TopRightTextNav() {
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
        </div>
      </div>
    </div>
  );
}
