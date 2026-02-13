import Link from "next/link";

export function TopRightTextNav() {
  return (
    <div className="fixed right-4 top-4 z-50 flex gap-4 text-sm text-stone-900 sm:right-6 sm:top-6">
      <Link href="/about" className="hover:underline">
        About
      </Link>
    </div>
  );
}
