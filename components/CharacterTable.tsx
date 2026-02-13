"use client";

import { useMemo, useState } from "react";
import { getHskMutedBgValue, normalizeHskLevel } from "@/lib/hskStyles";
import { normalizePinyin, tokenizePinyin } from "@/lib/pinyin";
import { EnrichedCharacter } from "@/lib/types";

interface CharacterTableProps {
  title: string;
  rows: EnrichedCharacter[];
  emptyMessage: string;
  onSetKnown?: (character: string) => Promise<void> | void;
  onSetStudy?: (character: string) => Promise<void> | void;
}

export function CharacterTable({
  title,
  rows,
  emptyMessage,
  onSetKnown,
  onSetStudy
}: CharacterTableProps) {
  const [search, setSearch] = useState("");
  const [hskFilter, setHskFilter] = useState<string>("all");
  const [hasTradAltOnly, setHasTradAltOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"character" | "hsk" | "frequency_rank_asc" | "frequency_rank_desc">(
    "frequency_rank_asc"
  );

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
    <section className="rounded-2xl border border-line bg-white p-4 shadow-card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-medium text-stone-800">{title}</h2>
        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search char / pinyin / trad-alt"
            className="rounded-lg border border-line bg-stone-50 px-3 py-1.5 text-sm outline-none focus:border-stone-400"
          />
          <select
            value={hskFilter}
            onChange={(e) => setHskFilter(e.target.value)}
            className="rounded-lg border border-line bg-stone-50 px-3 py-1.5 text-sm outline-none focus:border-stone-400"
          >
            <option value="all">HSK: All</option>
            <option value="1">HSK 1</option>
            <option value="2">HSK 2</option>
            <option value="3">HSK 3</option>
            <option value="4">HSK 4</option>
            <option value="5">HSK 5</option>
            <option value="6">HSK 6</option>
            <option value="unknown">HSK Unknown</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "character" | "hsk" | "frequency_rank_asc" | "frequency_rank_desc")
            }
            className="rounded-lg border border-line bg-stone-50 px-3 py-1.5 text-sm outline-none focus:border-stone-400"
          >
            <option value="frequency_rank_asc">Sort: Most frequent to least</option>
            <option value="frequency_rank_desc">Sort: Least frequent to most</option>
            <option value="hsk">Sort: HSK</option>
            <option value="character">Sort: Character</option>
          </select>
          <label className="flex items-center gap-2 rounded-lg border border-line bg-stone-50 px-3 py-1.5 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={hasTradAltOnly}
              onChange={(e) => setHasTradAltOnly(e.target.checked)}
              className="h-4 w-4"
            />
            Has Trad/Alt
          </label>
        </div>
      </div>

      <div className="table-scroll">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="text-center text-stone-500">
              <th className="border-b border-line bg-white py-2">字</th>
              <th className="border-b border-line bg-white py-2">Pinyin</th>
              <th className="hidden w-80 border-b border-line bg-white py-2 md:table-cell">Definition</th>
              <th className="border-b border-line bg-white py-2">HSK</th>
              <th className="hidden border-b border-line bg-white py-2 md:table-cell">Freq</th>
              <th className="hidden w-36 border-b border-line bg-white py-2 md:table-cell">Trad / Alt</th>
              <th className="border-b border-line bg-white py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-stone-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filtered.map((row, idx) => {
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
                  <tr key={`${row.character}-${row.pinyin || ""}-${idx}`} className="border-b border-stone-100 text-center align-middle">
                    <td className="py-2 text-lg">{row.character}</td>
                    <td className="max-w-40 truncate py-2 md:max-w-none" title={pinyinDisplay || "-"}>
                      {pinyinDisplay || "-"}
                    </td>
                    <td
                      className="hidden w-80 max-w-80 truncate py-2 text-left text-xs text-stone-700 md:table-cell"
                      title={row.definition || "-"}
                    >
                      {row.definition || "-"}
                    </td>
                    <td className="py-2">
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
                    <td className="hidden py-2 md:table-cell">{row.frequency ?? "-"}</td>
                    <td className="hidden w-36 max-w-36 truncate py-2 text-lg md:table-cell" title={alt || "-"}>
                      {alt || "-"}
                    </td>
                    <td className="py-2">
                      {onSetKnown && onSetStudy ? (
                        <button
                          onClick={() =>
                            row.status === "known" ? onSetStudy(row.character) : onSetKnown(row.character)
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full border transition ${
                            row.status === "known"
                              ? "border-emerald-600 bg-emerald-600"
                              : "border-stone-300 bg-stone-300"
                          }`}
                          title={row.status === "known" ? "Switch to study" : "Switch to known"}
                          aria-label={row.status === "known" ? "Known (on)" : "Known (off)"}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              row.status === "known" ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-center text-xs text-stone-500 md:hidden">
        You are in the mobile experience. For definitions and traditional characters, use the desktop page.
      </p>
    </section>
  );
}
