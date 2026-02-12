"use client";

import { getHanziMap, getHskColor } from "@/lib/hanzidb";
import { isChineseChar } from "@/lib/cjk";

interface TextLoaderProps {
  text: string;
  selected: Set<string>;
  known: Set<string>;
  onToggle: (character: string) => void;
}

const hanziMap = getHanziMap();

export function TextLoader({ text, selected, known, onToggle }: TextLoaderProps) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
      <div className="whitespace-pre-wrap leading-9">
        {[...text].map((ch, idx) => {
          if (!isChineseChar(ch)) {
            return <span key={`${ch}-${idx}`}>{ch}</span>;
          }

          const info = hanziMap.get(ch);
          const colorClass = getHskColor((info?.hsk_level as number | null | undefined) ?? null);
          const isKnown = known.has(ch);
          const isSelected = selected.has(ch);

          return (
            <span
              key={`${ch}-${idx}`}
              onClick={() => {
                if (!isKnown) onToggle(ch);
              }}
              className={`inline-block rounded px-0.5 text-2xl transition ${colorClass} ${
                isKnown ? "cursor-not-allowed opacity-85" : "cursor-pointer hover:bg-stone-200"
              } ${isSelected ? "bg-stone-200" : "bg-transparent"}`}
              title={isKnown ? "Already known" : "Toggle log selection"}
            >
              {ch}
            </span>
          );
        })}
      </div>
    </div>
  );
}
