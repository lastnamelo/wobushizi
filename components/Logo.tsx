"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface LogoProps {
  onHomeClick?: () => void;
}

export function Logo({ onHomeClick }: LogoProps) {
  const pathname = usePathname();

  if (pathname === "/" && onHomeClick) {
    return (
      <div className="flex justify-center">
        <button type="button" onClick={onHomeClick} aria-label="Go home">
          <Image
            src="/wobushizi-logo.png"
            alt="我不识字"
            width={360}
            height={160}
            priority
            className="h-auto w-[220px] sm:w-[320px]"
          />
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <Link href="/" aria-label="Go home">
        <Image
          src="/wobushizi-logo.png"
          alt="我不识字"
          width={360}
          height={160}
          priority
          className="h-auto w-[220px] sm:w-[320px]"
        />
      </Link>
    </div>
  );
}
