"use client";

import { memo } from "react";
import { lookupHanziEntry } from "@/lib/hanzidb";
import { getHskColorValue } from "@/lib/hskStyles";
import { isChineseChar } from "@/lib/cjk";

interface TextLoaderProps {
  text: string;
  selected: Set<string>;
  known: Set<string>;
  onToggle: (character: string) => void;
}

export const TextLoader = memo(function TextLoader({ text, selected, known, onToggle }: TextLoaderProps) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
      <div className="whitespace-pre-wrap leading-8">
        {[...text].map((ch, idx) => {
          if (!isChineseChar(ch)) {
            return <span key={`${ch}-${idx}`}>{ch}</span>;
          }

          const info = lookupHanziEntry(ch);
          const colorValue = getHskColorValue((info?.hsk_level as number | null | undefined) ?? null);
          const isKnown = known.has(ch);
          const isSelected = selected.has(ch);
          const pinyin = typeof info?.pinyin === "string" ? info.pinyin : "";
          const tooltipText = pinyin || (isKnown ? "Previously known" : "No pinyin");

          return (
            <span
              key={`${ch}-${idx}`}
              onClick={() => onToggle(ch)}
              className="inline-block cursor-pointer px-0.5 text-xl transition"
              style={{
                color: colorValue,
                backgroundColor: isSelected ? "#cad4d9" : "transparent"
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.backgroundColor = "#f2f5f8";
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
              }}
              title={tooltipText}
            >
              {ch}
            </span>
          );
        })}
      </div>
    </div>
  );
});
