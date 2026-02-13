import Link from "next/link";

export function TopRightTextNav() {
  return (
    <div className="absolute right-4 top-4 flex gap-4 text-sm text-stone-900 sm:right-6 sm:top-6">
      <a href="/" className="hover:underline">
        Home
      </a>
      <Link href="/about" className="hover:underline">
        About
      </Link>
    </div>
  );
}
