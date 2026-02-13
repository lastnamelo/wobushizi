import Link from "next/link";

interface BankQuickNavProps {
  active?: "home" | "character" | "study" | "master";
  onSelectBankTab?: (tab: "character" | "study") => void;
}

export function BankQuickNav({ active, onSelectBankTab }: BankQuickNavProps) {
  const items: Array<{ key: "home" | "character" | "study" | "master"; label: string; href: string }> = [
    { key: "home", label: "Home", href: "/" },
    { key: "character", label: "Character Bank", href: "/bank?tab=character" },
    { key: "study", label: "Study Bank", href: "/bank?tab=study" },
    { key: "master", label: "Master List", href: "/master" }
  ];

  return (
    <div className="mt-4 flex justify-center">
      <div className="inline-flex rounded-full border border-line bg-white p-1 text-sm">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          onClick={() => {
            if ((item.key === "character" || item.key === "study") && onSelectBankTab) onSelectBankTab(item.key);
          }}
          className={`rounded-full px-3 py-1.5 transition ${
            active === item.key
              ? "bg-stone-800 text-white"
              : "text-stone-700 hover:bg-slate-100"
          }`}
        >
          {item.label}
        </Link>
      ))}
      </div>
    </div>
  );
}
