import Image from "next/image";

export function Logo() {
  return (
    <div className="flex justify-center">
      <Image
        src="/wobushizi-logo.png"
        alt="我不识字"
        width={360}
        height={160}
        priority
        className="h-auto w-[260px] sm:w-[320px]"
      />
    </div>
  );
}
