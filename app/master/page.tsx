"use client";

import { useEffect, useMemo, useState } from "react";
import { BankQuickNav } from "@/components/BankQuickNav";
import { Logo } from "@/components/Logo";
import { ProgressBar } from "@/components/ProgressBar";
import { TopRightTextNav } from "@/components/TopRightTextNav";
import {
  ensureLocalProfile,
  fetchAllCharacterStatesLocal,
  fetchKnownCountLocal,
  setCharacterStatusLocal
} from "@/lib/localStore";
import { getHanziData, lookupHanziEntry } from "@/lib/hanzidb";
import { getHskMutedBgValue, normalizeHskLevel } from "@/lib/hskStyles";
import { normalizePinyin, tokenizePinyin } from "@/lib/pinyin";
import { CharacterStatus, EnrichedCharacter, HanzidbEntry } from "@/lib/types";

const allRows = getHanziData();

function toDisplayRow(row: HanzidbEntry, status: CharacterStatus | "none"): EnrichedCharacter {
  const lookupCharacter = lookupHanziEntry(row.character);
  return {
    character: lookupCharacter?.character ? String(lookupCharacter.character) : row.character,
    status: status === "none" ? undefined : status,
    traditional_character:
      row.traditional_character && row.traditional_character !== row.character
        ? String(row.traditional_character)
        : "",
    alternate_characters: typeof row.alternate_characters === "string" ? row.alternate_characters : "",
    pinyin: row.pinyin ? String(row.pinyin) : "",
    pinyin_alternates: typeof row.pinyin_alternates === "string" ? row.pinyin_alternates : "",
    hsk_level: typeof row.hsk_level === "number" ? row.hsk_level : null,
    frequency: typeof row.frequency === "number" ? row.frequency : null,
    definition: row.definition ? String(row.definition) : ""
  };
}

export default function MasterPage() {
  const [loading, setLoading] = useState(true);
  const [knownCount, setKnownCount] = useState(0);
  const [stateMap, setStateMap] = useState<Map<string, CharacterStatus>>(new Map());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "known" | "study" | "none">("all");
  const [hskFilter, setHskFilter] = useState<string>("all");
  const [hasTradAltOnly, setHasTradAltOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"frequency_rank_asc" | "frequency_rank_desc" | "hsk" | "character">(
    "frequency_rank_asc"
  );
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      await ensureLocalProfile();
      const [states, count] = await Promise.all([fetchAllCharacterStatesLocal(), fetchKnownCountLocal()]);
      const map = new Map<string, CharacterStatus>();
      for (const row of states) {
        map.set(row.character, row.status);
      }
      setStateMap(map);
      setKnownCount(count);
      setLoading(false);
    })().catch((err: Error) => {
      setMessage(err.message);
      setLoading(false);
    });
  }, []);

  const visibleRows = useMemo(() => {
    const query = search.trim().normalize("NFKC").toLowerCase();
    const normalizedQ = normalizePinyin(query);
    const isLatinQuery = normalizedQ.length > 0 && /^[a-z]+$/.test(normalizedQ);

    const raw = allRows
      .filter((row) => {
        if (!row.character) return false;
        const hasTradAlt =
          Boolean(String(row.traditional_character ?? "").trim()) ||
          Boolean(String(row.alternate_characters ?? "").trim());
        if (hasTradAltOnly && !hasTradAlt) return false;

        const status = stateMap.get(row.character) ?? "none";
        const hsk = typeof row.hsk_level === "number" ? String(row.hsk_level) : "unknown";

        if (statusFilter !== "all" && status !== statusFilter) return false;
        if (hskFilter !== "all" && hsk !== hskFilter) return false;
        if (!query) return true;

        const pinyin = [String(row.pinyin ?? ""), String(row.pinyin_alternates ?? "")]
          .filter(Boolean)
          .join(" ");
        const tokens = tokenizePinyin(pinyin);

        if (isLatinQuery) {
          return tokens.some((token) => token === normalizedQ);
        }

        return (
          row.character.includes(query) ||
          String(row.traditional_character ?? "").includes(query) ||
          String(row.alternate_characters ?? "").includes(query) ||
          tokens.some((token) => token.startsWith(normalizedQ))
        );
      })
      .map((row) => toDisplayRow(row, stateMap.get(row.character) ?? "none"))
      .sort((a, b) => {
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

    // Deduplicate by simplified character so search results don't show repeated entries.
    const deduped = new Map<string, EnrichedCharacter>();
    for (const row of raw) {
      const existing = deduped.get(row.character);
      if (!existing) {
        deduped.set(row.character, row);
        continue;
      }
      const existingFreq = existing.frequency ?? Number.MAX_SAFE_INTEGER;
      const rowFreq = row.frequency ?? Number.MAX_SAFE_INTEGER;
      if (rowFreq < existingFreq) {
        deduped.set(row.character, row);
      }
    }

    return [...deduped.values()];
  }, [search, statusFilter, hskFilter, hasTradAltOnly, sortBy, stateMap]);

  async function setStatus(character: string, status: CharacterStatus) {
    await setCharacterStatusLocal(character, status);

    setStateMap((prev) => {
      const next = new Map(prev);
      next.set(character, status);
      return next;
    });

    const count = await fetchKnownCountLocal();
    setKnownCount(count);
  }

  return (
    <main className="relative mx-auto min-h-screen max-w-7xl px-4 py-10 sm:px-6">
      <TopRightTextNav />

      <Logo />
      <ProgressBar knownCount={knownCount} />
      <BankQuickNav active="master" />

      {loading ? <p className="mt-6 text-center text-stone-600">Loading...</p> : null}

      {!loading ? (
        <section className="mt-6 rounded-2xl border border-line bg-white p-4 shadow-card">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-medium text-stone-800">Master List</h2>
            <div className="flex flex-wrap gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search character / pinyin / trad-alt"
                className="min-w-64 flex-1 rounded-lg border border-line bg-stone-50 px-3 py-2 text-sm outline-none focus:border-stone-400"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "known" | "study" | "none")}
                className="hidden rounded-lg border border-line bg-stone-50 px-3 py-2 text-sm md:block"
              >
                <option value="all">Status: All</option>
                <option value="known">Known</option>
                <option value="study">Study</option>
                <option value="none">None</option>
              </select>
              <select
                value={hskFilter}
                onChange={(e) => setHskFilter(e.target.value)}
                className="rounded-lg border border-line bg-stone-50 px-3 py-2 text-sm"
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
                  setSortBy(e.target.value as "frequency_rank_asc" | "frequency_rank_desc" | "hsk" | "character")
                }
                className="hidden rounded-lg border border-line bg-stone-50 px-3 py-2 text-sm md:block"
              >
                <option value="frequency_rank_asc">Sort: Most frequent to least</option>
                <option value="frequency_rank_desc">Sort: Least frequent to most</option>
                <option value="hsk">Sort: HSK</option>
                <option value="character">Sort: Character</option>
              </select>
              <label className="hidden items-center gap-2 rounded-lg border border-line bg-stone-50 px-3 py-2 text-sm text-stone-700 md:flex">
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
            <table className="w-full text-sm">
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
                {visibleRows.map((row) => {
                  const pinyinAlt = String(row.pinyin_alternates ?? "")
                    .split("|")
                    .map((s) => s.trim())
                    .filter(Boolean);
                  const pinyinDisplay = [row.pinyin ?? "", ...pinyinAlt].filter(Boolean).join(" / ");

                  return (
                  <tr key={row.character} className="border-b border-stone-100 text-center">
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
                    <td className="hidden w-36 max-w-36 truncate py-2 text-lg md:table-cell">
                      {(() => {
                        const variants = new Set<string>();
                        if (row.traditional_character) variants.add(row.traditional_character);
                        if (row.alternate_characters) {
                          for (const item of row.alternate_characters.split("|")) {
                            const trimmed = item.trim();
                            if (trimmed) variants.add(trimmed);
                          }
                        }
                        return [...variants].join(" / ") || "-";
                      })()}
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => setStatus(row.character, row.status === "known" ? "study" : "known")}
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
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-center text-xs text-stone-500 md:hidden">
            You are in the mobile experience. For definitions and traditional characters, use the desktop page.
          </p>

          <p className="mt-3 text-xs text-stone-500">Showing {visibleRows.length.toLocaleString()} characters.</p>
          {message ? <p className="mt-2 text-sm text-rose-700">{message}</p> : null}
        </section>
      ) : null}
    </main>
  );
}
