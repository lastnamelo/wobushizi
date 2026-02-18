"use client";

import { memo, useMemo, useState } from "react";
import { lookupHanziEntry } from "@/lib/hanzidb";
import { getHskColorValue } from "@/lib/hskStyles";
import { isChineseChar } from "@/lib/cjk";
import { useIsCoarsePointer } from "@/lib/useIsCoarsePointer";

interface TextLoaderProps {
  text: string;
  selected: Set<string>;
  known: Set<string>;
  onToggle: (character: string) => void;
  showWordHints?: boolean;
}

function getWordHintSegmentMap(text: string): Map<number, number> {
  const segmentByIndex = new Map<number, number>();
  let segmentId = 0;

  // Prefer native Chinese segmentation when available. This stays light-weight and local.
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("zh", { granularity: "word" });
    const codeUnitToPoint = new Map<number, number>();
    let pointIdx = 0;
    let codeUnitIdx = 0;
    for (const ch of text) {
      codeUnitToPoint.set(codeUnitIdx, pointIdx);
      codeUnitIdx += ch.length;
      pointIdx += 1;
    }

    for (const seg of segmenter.segment(text)) {
      const segment = seg.segment;
      if (![...segment].every((ch) => isChineseChar(ch))) continue;
      const pointLen = [...segment].length;
      if (pointLen < 2 || pointLen > 4) continue;

      const start = codeUnitToPoint.get(seg.index);
      if (start == null) continue;

      for (let i = 0; i < pointLen; i += 1) {
        segmentByIndex.set(start + i, segmentId);
      }
      segmentId += 1;
    }
  }

  return segmentByIndex;
}

export const TextLoader = memo(function TextLoader({
  text,
  selected,
  known,
  onToggle,
  showWordHints = false
}: TextLoaderProps) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const isCoarsePointer = useIsCoarsePointer();

  const wordHintSegments = useMemo(() => {
    if (!showWordHints) return new Map<number, number>();
    return getWordHintSegmentMap(text);
  }, [showWordHints, text]);

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
          const segmentId = wordHintSegments.get(idx);
          const nextSegmentId = wordHintSegments.get(idx + 1);
          const hasWordHint = segmentId != null;
          const isWordEnd = hasWordHint && nextSegmentId !== segmentId;

          return (
            <span
              key={`${ch}-${idx}`}
              onClick={() => onToggle(ch)}
              className="inline-block cursor-pointer px-0.5 text-xl transition"
              style={{
                color: colorValue,
                backgroundColor: isSelected ? "#cad4d9" : "transparent",
                borderBottom:
                  showWordHints && hasWordHint
                    ? "1.5px solid #111111"
                    : "1.5px solid transparent",
                marginRight: showWordHints && isWordEnd ? "0.08em" : "0"
              }}
              onMouseEnter={(e) => {
                if (isCoarsePointer) return;
                if (!isSelected) e.currentTarget.style.backgroundColor = "#f2f5f8";
                setTooltip({
                  text: tooltipText,
                  x: e.clientX + 10,
                  y: e.clientY + 18
                });
              }}
              onMouseMove={(e) => {
                if (isCoarsePointer) return;
                setTooltip((prev) =>
                  prev
                    ? {
                        ...prev,
                        x: e.clientX + 10,
                        y: e.clientY + 18
                      }
                    : null
                );
              }}
              onMouseLeave={(e) => {
                if (isCoarsePointer) return;
                if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                setTooltip(null);
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
      {tooltip && !isCoarsePointer ? (
        <div
          className="pointer-events-none fixed z-[120] px-2 py-1 text-xs text-stone-900"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            backgroundColor: "#f6f6f6"
          }}
        >
          {tooltip.text}
        </div>
      ) : null}
    </div>
  );
});
