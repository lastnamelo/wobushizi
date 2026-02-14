import Image from "next/image";
import Link from "next/link";

export function Logo() {
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
