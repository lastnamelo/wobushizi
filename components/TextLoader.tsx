"use client";

import { getHskColor, lookupHanziEntry } from "@/lib/hanzidb";
import { isChineseChar } from "@/lib/cjk";

interface TextLoaderProps {
  text: string;
  selected: Set<string>;
  known: Set<string>;
  onToggle: (character: string) => void;
}

export function TextLoader({ text, selected, known, onToggle }: TextLoaderProps) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
      <div className="whitespace-pre-wrap leading-9">
        {[...text].map((ch, idx) => {
          if (!isChineseChar(ch)) {
            return <span key={`${ch}-${idx}`}>{ch}</span>;
          }

          const info = lookupHanziEntry(ch);
          const colorClass = getHskColor((info?.hsk_level as number | null | undefined) ?? null);
          const isKnown = known.has(ch);
          const isSelected = selected.has(ch);

          return (
            <span
              key={`${ch}-${idx}`}
              onClick={() => onToggle(ch)}
              className={`inline-block rounded px-0.5 text-2xl transition ${colorClass} ${
                isKnown ? "cursor-pointer ring-1 ring-stone-300 hover:bg-stone-200" : "cursor-pointer hover:bg-stone-200"
              } ${isSelected ? "bg-stone-200" : "bg-transparent"}`}
              title={isKnown ? "Previously known (click to keep known or move to study)" : "Toggle log selection"}
            >
              {ch}
            </span>
          );
        })}
      </div>
    </div>
  );
}
