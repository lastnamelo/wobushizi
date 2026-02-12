"use client";

import { useMemo, useState } from "react";
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
  const [sortBy, setSortBy] = useState<"character" | "hsk" | "frequency">("character");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const subset = rows.filter((row) => {
      if (!q) return true;
      return (
        row.character.includes(q) ||
        (row.pinyin ?? "").toLowerCase().includes(q) ||
        String(row.hsk_level ?? "").includes(q)
      );
    });

    return subset.sort((a, b) => {
      if (sortBy === "hsk") {
        const ah = a.hsk_level ?? 99;
        const bh = b.hsk_level ?? 99;
        if (ah !== bh) return ah - bh;
      }
      if (sortBy === "frequency") {
        const af = a.frequency ?? Number.MAX_SAFE_INTEGER;
        const bf = b.frequency ?? Number.MAX_SAFE_INTEGER;
        if (af !== bf) return af - bf;
      }
      return a.character.localeCompare(b.character, "zh-Hans-CN");
    });
  }, [rows, search, sortBy]);

  return (
    <section className="rounded-2xl border border-line bg-white p-4 shadow-card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-medium text-stone-800">{title}</h2>
        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="rounded-lg border border-line bg-stone-50 px-3 py-1.5 text-sm outline-none focus:border-stone-400"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "character" | "hsk" | "frequency")}
            className="rounded-lg border border-line bg-stone-50 px-3 py-1.5 text-sm outline-none focus:border-stone-400"
          >
            <option value="character">Sort: Character</option>
            <option value="hsk">Sort: HSK</option>
            <option value="frequency">Sort: Frequency</option>
          </select>
        </div>
      </div>

      <div className="table-scroll">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-stone-500">
              <th className="border-b border-line py-2">字</th>
              <th className="border-b border-line py-2">繁</th>
              <th className="border-b border-line py-2">Pinyin</th>
              <th className="border-b border-line py-2">HSK</th>
              <th className="border-b border-line py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-stone-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.character} className="border-b border-stone-100">
                  <td className="py-2 text-lg">{row.character}</td>
                  <td className="py-2">{row.traditional_character || "-"}</td>
                  <td className="py-2">{row.pinyin || "-"}</td>
                  <td className="py-2">{row.hsk_level ?? "-"}</td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      {onSetKnown ? (
                        <button
                          onClick={() => onSetKnown(row.character)}
                          className="rounded-lg border border-line px-2 py-1 text-xs text-stone-700 hover:bg-stone-100"
                        >
                          Move to known
                        </button>
                      ) : null}
                      {onSetStudy ? (
                        <button
                          onClick={() => onSetStudy(row.character)}
                          className="rounded-lg border border-line px-2 py-1 text-xs text-stone-700 hover:bg-stone-100"
                        >
                          Move to study
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
