"use client";

import { memo, useMemo, useState } from "react";
import { lookupHanziEntry } from "@/lib/hanzidb";
import { getHskColorValue } from "@/lib/hskStyles";
import { isChineseChar } from "@/lib/cjk";
import { useDeviceCapabilities } from "@/lib/useDeviceCapabilities";

interface TextLoaderProps {
  text: string;
  selected: Set<string>;
  known: Set<string>;
  onToggle: (character: string) => void;
  showWordHints?: boolean;
}

function getWordHintSegmentMap(text: string): Map<number, { id: number; text: string }> {
  const segmentByIndex = new Map<number, { id: number; text: string }>();
  let segmentId = 0;
  const chars = [...text];

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
        segmentByIndex.set(start + i, { id: segmentId, text: segment });
      }
      segmentId += 1;
    }
  }

  // Supplement with 2-char windows where segmenter did not tag a char.
  for (let i = 0; i < chars.length - 1; i += 1) {
    if (segmentByIndex.has(i) || segmentByIndex.has(i + 1)) continue;
    const a = chars[i];
    const b = chars[i + 1];
    if (!a || !b) continue;
    if (!isChineseChar(a) || !isChineseChar(b)) continue;
    const word = `${a}${b}`;
    segmentByIndex.set(i, { id: segmentId, text: word });
    segmentByIndex.set(i + 1, { id: segmentId, text: word });
    segmentId += 1;
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
  const { enableHoverTooltip } = useDeviceCapabilities();

  const wordHintSegments = useMemo(() => {
    if (!showWordHints) return new Map<number, { id: number; text: string }>();
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
          const segment = wordHintSegments.get(idx);
          const nextSegment = wordHintSegments.get(idx + 1);
          const hasWordHint = segment != null;
          const isWordEnd = hasWordHint && nextSegment?.id !== segment?.id;

          return (
            <span
              key={`${ch}-${idx}`}
              onClick={(e) => {
                if (showWordHints && e.shiftKey && segment?.text) {
                  const encoded = encodeURIComponent(segment.text);
                  window.open(
                    `https://translate.google.com/?sl=zh-CN&tl=en&text=${encoded}&op=translate`,
                    "_blank",
                    "noopener,noreferrer"
                  );
                  return;
                }
                onToggle(ch);
              }}
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
                if (!enableHoverTooltip) return;
                if (!isSelected) e.currentTarget.style.backgroundColor = "#f2f5f8";
                setTooltip({
                  text: tooltipText,
                  x: e.clientX + 10,
                  y: e.clientY + 18
                });
              }}
              onMouseMove={(e) => {
                if (!enableHoverTooltip) return;
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
                if (!enableHoverTooltip) return;
                if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                setTooltip(null);
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
      {tooltip && enableHoverTooltip ? (
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
