import Link from "next/link";

export function TopRightTextNav() {
  return (
    <div className="fixed right-4 top-3 z-30 text-right sm:right-6 sm:top-6">
      <div className="flex flex-col items-end gap-1 text-sm text-stone-900">
        <Link href="/about" className="hover:underline">
          About
        </Link>
        <Link href="/contact" className="hover:underline">
          Contact
        </Link>
      </div>
    </div>
  );
}
