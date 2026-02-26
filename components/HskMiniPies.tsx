"use client";

import { CSSProperties } from "react";
import { HskCounts, TOTAL_HSK_COUNTS } from "@/lib/hskCounts";

function pieSlicePath(percent: number): string {
  const clamped = Math.max(0, Math.min(percent, 100));
  if (clamped <= 0) return "";
  if (clamped >= 100) {
    return "M 12 12 m -10 0 a 10 10 0 1 0 20 0 a 10 10 0 1 0 -20 0";
  }
  const angle = (clamped / 100) * 360;
  const rad = ((angle - 90) * Math.PI) / 180;
  const x = 12 + 10 * Math.cos(rad);
  const y = 12 + 10 * Math.sin(rad);
  const largeArc = angle > 180 ? 1 : 0;
  return `M 12 12 L 12 2 A 10 10 0 ${largeArc} 1 ${x} ${y} Z`;
}

export function HskMiniPies({
  stats,
  denominators = TOTAL_HSK_COUNTS,
  className = ""
}: {
  stats: HskCounts;
  denominators?: HskCounts;
  className?: string;
}) {
  const entries: Array<{ label: string; count: number; color: string }> = [
    { label: "HSK 1", count: stats[1], color: "var(--h1)" },
    { label: "HSK 2", count: stats[2], color: "var(--h2)" },
    { label: "HSK 3", count: stats[3], color: "var(--h3)" },
    { label: "HSK 4", count: stats[4], color: "var(--h4)" },
    { label: "HSK 5", count: stats[5], color: "var(--h5)" },
    { label: "HSK 6", count: stats[6], color: "var(--h6)" },
    { label: "Unknown", count: stats.unknown, color: "var(--h0)" }
  ];
  return (
    <div
      className={`rounded-xl border border-line bg-white p-3 shadow-card ${className}`.trim()}
      style={
        {
          "--h1": "#c41d0e",
          "--h2": "#15803d",
          "--h3": "#1d4ed8",
          "--h4": "#fa6f19",
          "--h5": "#8f7bbf",
          "--h6": "#f74f90",
          "--h0": "#6b7280"
        } as CSSProperties
      }
    >
      <div className="flex flex-wrap justify-center gap-5">
        {entries.map((entry) => {
          const denominator =
            entry.label === "Unknown"
              ? denominators.unknown
              : denominators[Number(entry.label.replace("HSK ", "")) as 1 | 2 | 3 | 4 | 5 | 6];
          const pct = denominator > 0 ? Math.min((entry.count / denominator) * 100, 100) : 0;
          return (
            <div key={entry.label} className="flex items-center gap-2 text-xs leading-none text-stone-600">
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                className="block shrink-0 overflow-hidden rounded-full border border-stone-300"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" fill="#ddd6cc" />
                {pct > 0 ? <path d={pieSlicePath(pct)} fill={entry.color} /> : null}
              </svg>
              <span className="flex flex-col leading-tight" style={{ color: entry.color }}>
                <span>{entry.label}</span>
                <span>
                  ({entry.count}/{denominator})
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
