"use client";

import { useEffect } from "react";
import { lookupHanziEntry } from "@/lib/hanzidb";
import { getHskMutedBgValue, normalizeHskLevel } from "@/lib/hskStyles";
import { CharacterStatus } from "@/lib/types";

interface CharacterDetailModalProps {
  character: string | null;
  status?: CharacterStatus | "none";
  onSetStatus?: (status: CharacterStatus) => void | Promise<void>;
  onClose: () => void;
}

export function CharacterDetailModal({ character, status, onSetStatus, onClose }: CharacterDetailModalProps) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!character) return null;

  const meta = lookupHanziEntry(character);
  const displayChar = meta?.character ? String(meta.character) : character;
  const trad = String(meta?.traditional_character ?? "").trim();
  const altRaw = String(meta?.alternate_characters ?? "").trim();
  const altList = altRaw
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => s !== trad);
  const pinyinPrimary = String(meta?.pinyin ?? "").trim();
  const pinyinAlt = String(meta?.pinyin_alternates ?? "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
  const pinyinDisplay = [pinyinPrimary, ...pinyinAlt].filter(Boolean).join(" / ") || "-";
  const level = normalizeHskLevel(meta?.hsk_level);
  const isKnown = status === "known";
  const showStatusToggle = Boolean(onSetStatus);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-md rounded-2xl border border-line bg-white p-5 text-center shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-2 text-sm text-[#806252] hover:text-stone-800"
          aria-label="Close"
        >
          x
        </button>
        <div className="mb-3">
          <div className="text-4xl text-stone-900">{displayChar}</div>
          <div className="mt-1 text-sm text-stone-700">{pinyinDisplay}</div>
        </div>

        {showStatusToggle ? (
          <div className="mb-3 flex justify-center">
            <button
              onClick={() => onSetStatus?.(isKnown ? "study" : "known")}
              className={`relative inline-flex h-7 w-12 items-center rounded-full border transition ${
                isKnown ? "border-emerald-600 bg-emerald-600" : "border-stone-300 bg-stone-300"
              }`}
              title={isKnown ? "Switch to study" : "Switch to known"}
              aria-label={isKnown ? "Known (on)" : "Known (off)"}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  isKnown ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        ) : null}

        <div className="space-y-2 text-sm text-stone-700">
          <div className="flex items-center justify-center gap-2">
            <span className="font-semibold text-[#806252]">HSK</span>
            <span
              className="inline-block rounded-full px-2 py-0.5 text-xs text-stone-900"
              style={{ backgroundColor: getHskMutedBgValue(level), color: "#111827" }}
            >
              {meta?.hsk_level ?? "-"}
            </span>
            <span className="ml-2 font-semibold text-[#806252]">Freq</span>
            <span>{String(meta?.frequency ?? "-")}</span>
          </div>
          <div>
            <span className="font-semibold text-[#806252]">Definition</span>
            <p className="mt-0.5 leading-6">{String(meta?.definition ?? "-")}</p>
          </div>
          <div>
            <span className="font-semibold text-[#806252]">Traditional / Alt</span>
            <p className="mt-0.5 text-base">
              {[trad, ...altList].filter(Boolean).join(" / ") || "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
