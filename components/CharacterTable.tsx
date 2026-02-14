"use client";

import { useMemo, useState } from "react";
import { CharacterDetailModal } from "@/components/CharacterDetailModal";
import { getHskMutedBgValue, normalizeHskLevel } from "@/lib/hskStyles";
import { normalizePinyin, tokenizePinyin } from "@/lib/pinyin";
import { EnrichedCharacter } from "@/lib/types";

interface CharacterTableProps {
  rows: EnrichedCharacter[];
  emptyMessage: string;
  onSetKnown?: (character: string) => Promise<void> | void;
  onSetStudy?: (character: string) => Promise<void> | void;
  pendingCharacters?: Set<string>;
}

export function CharacterTable({
  rows,
  emptyMessage,
  onSetKnown,
  onSetStudy,
  pendingCharacters
}: CharacterTableProps) {
  const [search, setSearch] = useState("");
  const [hskFilter, setHskFilter] = useState<string>("all");
  const [hasTradAltOnly, setHasTradAltOnly] = useState(false);
  const [detailState, setDetailState] = useState<{ character: string; status?: "known" | "study" } | null>(null);
  const [sortBy, setSortBy] = useState<"character" | "hsk" | "frequency_rank_asc" | "frequency_rank_desc">("frequency_rank_asc");

  const filtered = useMemo(() => {
    const dedupedRows = new Map<string, EnrichedCharacter>();
    for (const row of rows) {
      const existing = dedupedRows.get(row.character);
      if (!existing) {
        dedupedRows.set(row.character, row);
        continue;
      }
      const existingFreq = existing.frequency ?? Number.MAX_SAFE_INTEGER;
      const rowFreq = row.frequency ?? Number.MAX_SAFE_INTEGER;
      if (rowFreq < existingFreq) {
        dedupedRows.set(row.character, {
          ...row,
          alternate_characters: existing.alternate_characters || row.alternate_characters,
          traditional_character: existing.traditional_character || row.traditional_character
        });
      }
    }

    const q = search.trim().normalize("NFKC").toLowerCase();
    const normalizedQ = normalizePinyin(q);
    const isLatinQuery = normalizedQ.length > 0 && /^[a-z]+$/.test(normalizedQ);

    const subset = [...dedupedRows.values()].filter((row) => {
      const hasTradAlt =
        Boolean(String(row.traditional_character ?? "").trim()) ||
        Boolean(String(row.alternate_characters ?? "").trim());
      if (hasTradAltOnly && !hasTradAlt) return false;

      if (hskFilter !== "all") {
        const rowHsk = row.hsk_level == null ? "unknown" : String(row.hsk_level);
        if (rowHsk !== hskFilter) return false;
      }

      if (!q) return true;

      const basePinyin = [String(row.pinyin ?? ""), String(row.pinyin_alternates ?? "")]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const pinyinTokens = tokenizePinyin(basePinyin);
      const alt = row.alternate_characters ?? "";

      if (isLatinQuery) {
        return pinyinTokens.some((token) => token === normalizedQ);
      }

      return (
        row.character.includes(q) ||
        String(row.traditional_character ?? "").includes(q) ||
        alt.includes(q) ||
        pinyinTokens.some((token) => token.startsWith(normalizedQ)) ||
        String(row.hsk_level ?? "").includes(q) ||
        String(row.frequency ?? "").includes(q)
      );
    });

    return subset.sort((a, b) => {
      if (sortBy === "frequency_rank_asc" || sortBy === "frequency_rank_desc") {
        const af = a.frequency ?? Number.MAX_SAFE_INTEGER;
        const bf = b.frequency ?? Number.MAX_SAFE_INTEGER;
        if (af !== bf) {
          return sortBy === "frequency_rank_asc" ? af - bf : bf - af;
        }
      }
      if (sortBy === "hsk") {
        const ah = a.hsk_level ?? 99;
        const bh = b.hsk_level ?? 99;
        if (ah !== bh) return ah - bh;
      }
      return a.character.localeCompare(b.character, "zh-Hans-CN");
    });
  }, [rows, search, sortBy, hskFilter, hasTradAltOnly]);

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-white p-4 shadow-card">
      <div className="table-scroll min-h-0 flex-1 overflow-hidden rounded-xl md:max-h-none md:overflow-visible">
        <div className="mb-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Seach character or pinyin..."
            className="w-full min-w-0 rounded-lg border border-line bg-stone-50 px-3 py-1.5 text-sm outline-none focus:border-stone-400"
          />
        </div>
        <table className="w-full table-fixed text-xs md:text-sm">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="text-center text-[#806252]">
              <th className="border-b border-line bg-white py-1.5 md:py-1">Character</th>
              <th className="border-b border-line bg-white py-1.5 md:py-1">Pinyin</th>
              <th
                className="cursor-pointer border-b border-line bg-white py-1.5 md:py-1"
                onClick={() => {
                  const order = ["all", "1", "2", "3", "4", "5", "6", "unknown"] as const;
                  const currentIndex = order.indexOf(hskFilter as (typeof order)[number]);
                  const next = order[(currentIndex + 1) % order.length];
                  setHskFilter(next);
                }}
              >
                <span className="inline-flex items-center gap-1">
                  HSK
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                    <path d="M2.5 4.5A1.5 1.5 0 0 1 4 3h12a1.5 1.5 0 0 1 1.2 2.4L12 12v4.25a.75.75 0 0 1-1.11.66l-2-1.11a.75.75 0 0 1-.39-.66V12L2.8 5.4a1.5 1.5 0 0 1-.3-.9Z" />
                  </svg>
                  {hskFilter !== "all" ? `(${hskFilter})` : ""}
                </span>
              </th>
              <th
                className="hidden cursor-pointer border-b border-line bg-white py-1.5 md:table-cell md:py-1"
                onClick={() =>
                  setSortBy((prev) =>
                    prev === "frequency_rank_asc"
                      ? "frequency_rank_desc"
                      : "frequency_rank_asc"
                  )
                }
              >
                Freq {sortBy === "frequency_rank_asc" ? "↑" : "↓"}
              </th>
              <th
                className="hidden w-36 cursor-pointer border-b border-line bg-white py-1.5 md:table-cell md:py-1"
                onClick={() => setHasTradAltOnly((prev) => !prev)}
              >
                Trad / Alt{"  "}
                <span className="inline-block align-middle text-xl leading-none">{hasTradAltOnly ? "●" : "○"}</span>
              </th>
              <th className="border-b border-line bg-white py-1.5 md:py-1">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-stone-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filtered.map((row, idx) => {
                const isPending = pendingCharacters?.has(row.character) ?? false;
                const variants = new Set<string>();
                if (row.traditional_character) variants.add(row.traditional_character);
                if (row.alternate_characters) {
                  for (const item of row.alternate_characters.split("|")) {
                    const trimmed = item.trim();
                    if (trimmed) variants.add(trimmed);
                  }
                }
                const alt = [...variants].join(" / ");
                const pinyinAlt = String(row.pinyin_alternates ?? "")
                  .split("|")
                  .map((s) => s.trim())
                  .filter(Boolean);
                const pinyinDisplay = [row.pinyin ?? "", ...pinyinAlt].filter(Boolean).join(" / ");

                return (
                  <tr
                    key={`${row.character}-${row.pinyin || ""}-${idx}`}
                    className={`border-b border-stone-100 text-center align-middle transition-opacity duration-500 ease-out ${
                      isPending ? "opacity-55" : "opacity-100"
                    }`}
                  >
                    <td className="py-1 text-base md:py-1 md:text-lg">
                      <button
                        onClick={() => setDetailState({ character: row.character, status: row.status })}
                        className="hover:underline"
                        title="View details"
                      >
                        {row.character}
                      </button>
                    </td>
                    <td className="max-w-40 truncate py-1 md:max-w-none md:py-1" title={pinyinDisplay || "-"}>
                      {pinyinDisplay || "-"}
                    </td>
                    <td className="py-1 md:py-1">
                      {(() => {
                        const level = normalizeHskLevel(row.hsk_level);
                        return (
                      <span
                        className="inline-block rounded-full px-2 py-0.5 text-xs text-stone-900"
                        style={{ backgroundColor: getHskMutedBgValue(level), color: "#111827" }}
                      >
                        {row.hsk_level ?? "-"}
                      </span>
                        );
                      })()}
                    </td>
                    <td className="hidden py-1 md:table-cell md:py-1">{row.frequency ?? "-"}</td>
                    <td className="hidden w-36 max-w-36 truncate py-1 text-base md:table-cell md:py-1 md:text-lg" title={alt || "-"}>
                      {alt || "-"}
                    </td>
                    <td className="py-1 md:py-1">
                      {onSetKnown && onSetStudy ? (
                        (() => {
                          return (
                        <button
                          onClick={() => {
                            if (isPending) return;
                            row.status === "known" ? onSetStudy(row.character) : onSetKnown(row.character);
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full border transition ${
                            row.status === "known"
                              ? "border-emerald-600 bg-emerald-600"
                              : "border-stone-300 bg-stone-300"
                          } ${isPending ? "opacity-70" : ""}`}
                          title={row.status === "known" ? "Switch to study" : "Switch to known"}
                          aria-label={row.status === "known" ? "Known (on)" : "Known (off)"}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              row.status === "known" ? "translate-x-6" : "translate-x-1"
                            } duration-300 ease-out`}
                          />
                        </button>
                          );
                        })()
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <CharacterDetailModal
        character={detailState?.character ?? null}
        status={detailState?.status}
        onSetStatus={(status) => {
          if (!detailState) return;
          if (status === "known") {
            onSetKnown?.(detailState.character);
          } else {
            onSetStudy?.(detailState.character);
          }
          setDetailState((prev) => (prev ? { ...prev, status } : prev));
        }}
        onClose={() => setDetailState(null)}
      />
    </section>
  );
}
