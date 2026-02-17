"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { BankQuickNav } from "@/components/BankQuickNav";
import { CharacterDetailModal } from "@/components/CharacterDetailModal";
import { HskMiniPies } from "@/components/HskMiniPies";
import { Logo } from "@/components/Logo";
import { Milestone1000Modal } from "@/components/Milestone1000Modal";
import { Milestone2500Modal } from "@/components/Milestone2500Modal";
import { Milestone500Modal } from "@/components/Milestone500Modal";
import { ProgressBar } from "@/components/ProgressBar";
import { TopRightTextNav } from "@/components/TopRightTextNav";
import {
  ensureLocalProfile,
  fetchAllCharacterStatesLocal,
  fetchKnownCountLocal,
  setCharacterStatusLocal
} from "@/lib/localStore";
import { getHanziData, lookupHanziEntry } from "@/lib/hanzidb";
import { countHskLevels } from "@/lib/hskCounts";
import { getHskMutedBgValue, normalizeHskLevel } from "@/lib/hskStyles";
import { normalizePinyin, tokenizePinyin } from "@/lib/pinyin";
import { CharacterStatus, EnrichedCharacter, HanzidbEntry } from "@/lib/types";
import { useMilestone1000, useMilestone2500, useMilestone500 } from "@/lib/useMilestone500";

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
  const [sortBy, setSortBy] = useState<"frequency_rank_asc" | "frequency_rank_desc" | "hsk" | "character">("frequency_rank_asc");
  const [message, setMessage] = useState<string | null>(null);
  const [detailState, setDetailState] = useState<{ character: string; status?: CharacterStatus } | null>(null);
  const { showMilestone, dismissMilestone } = useMilestone500(knownCount);
  const { showMilestone: showMilestone1000, dismissMilestone: dismissMilestone1000 } =
    useMilestone1000(knownCount);
  const { showMilestone: showMilestone2500, dismissMilestone: dismissMilestone2500 } =
    useMilestone2500(knownCount);

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
    const hasQuery = query.length > 0;
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
        // Default "all" view hides unknown-HSK rows for faster initial rendering.
        // Unknown rows are still available via search or the explicit "unknown" filter.
        if (hskFilter === "all" && !hasQuery && hsk === "unknown") return false;
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
  const masterStats = useMemo(() => {
    const tracked = Array.from(stateMap.entries())
      .filter(([, status]) => status === "known" || status === "study")
      .map(([character]) => {
        const row = lookupHanziEntry(character);
        return { hsk_level: row?.hsk_level };
      });
    return countHskLevels(tracked);
  }, [stateMap]);

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
    <main className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 sm:py-6 md:py-4">
      <AuthGate />
      <Milestone500Modal open={showMilestone} onClose={dismissMilestone} />
      <Milestone1000Modal open={showMilestone1000} onClose={dismissMilestone1000} />
      <Milestone2500Modal open={showMilestone2500} onClose={dismissMilestone2500} />
      <TopRightTextNav />

      <Logo />
      <ProgressBar knownCount={knownCount} />
      <BankQuickNav active="master" />
      <p className="mt-2 text-center text-[11px] text-stone-500 md:hidden">
        You are in the mobile experience. For more features, use desktop view.
      </p>
      <div className="mx-auto mt-5 hidden w-full max-w-4xl md:block">
        <HskMiniPies stats={masterStats} />
      </div>

      {loading ? <p className="mt-6 text-center text-stone-600">Loading...</p> : null}

      {!loading ? (
        <div className="mx-auto mt-3 w-full max-w-4xl md:mt-6">
          <p className="mb-2 text-center text-xs text-stone-600 md:text-sm">
            Click any character to view definitions and more.
          </p>
          <div className="relative w-full">
            <p className="pointer-events-none absolute -top-4 right-2 z-20 text-xs leading-none text-stone-600">
              {visibleRows.length.toLocaleString()} characters
            </p>
            <section className="min-h-0 w-full flex-1 overflow-hidden rounded-2xl border border-line bg-white p-4 shadow-card md:flex-none md:overflow-visible">
              <div className="mb-2">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Seach character or pinyin..."
                  className="w-full min-w-0 rounded-lg border border-line bg-stone-50 px-3 py-1.5 text-sm outline-none focus:border-stone-400"
                />
              </div>
              <div className="table-scroll overflow-y-auto rounded-xl">
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
                      {hskFilter !== "all" ? `(${hskFilter === "unknown" ? "-" : hskFilter})` : ""}
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
                  <th className="border-b border-line bg-white py-1.5 md:py-1">
                    <span className="inline-flex items-center gap-1">
                      Action
                      <button
                        onClick={() =>
                          setStatusFilter((prev) =>
                            prev === "all" ? "known" : prev === "known" ? "none" : "all"
                          )
                        }
                        className="inline-flex items-center"
                        title={
                          statusFilter === "all"
                            ? "Status filter: All"
                            : statusFilter === "known"
                              ? "Status filter: Known"
                              : "Status filter: Unknown"
                        }
                        aria-label={
                          statusFilter === "all"
                            ? "Status filter all"
                            : statusFilter === "known"
                              ? "Status filter known"
                              : "Status filter unknown"
                        }
                      >
                        <svg
                          viewBox="0 0 20 20"
                          className="h-3.5 w-3.5"
                          fill={
                            statusFilter === "all"
                              ? "#806252"
                              : statusFilter === "known"
                                ? "#15803d"
                                : "#b91c1c"
                          }
                          aria-hidden="true"
                        >
                          <path d="M2.5 4.5A1.5 1.5 0 0 1 4 3h12a1.5 1.5 0 0 1 1.2 2.4L12 12v4.25a.75.75 0 0 1-1.11.66l-2-1.11a.75.75 0 0 1-.39-.66V12L2.8 5.4a1.5 1.5 0 0 1-.3-.9Z" />
                        </svg>
                      </button>
                    </span>
                  </th>
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
                    <td className="hidden w-36 max-w-36 truncate py-1 text-base md:table-cell md:py-1 md:text-lg">
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
                    <td className="py-1 md:py-1">
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

              {message ? <p className="mt-2 text-sm text-rose-700">{message}</p> : null}
            </section>
          </div>
        </div>
      ) : null}
      <CharacterDetailModal
        character={detailState?.character ?? null}
        status={detailState?.status ?? "none"}
        onSetStatus={(status) => {
          if (!detailState) return;
          setStatus(detailState.character, status);
          setDetailState((prev) => (prev ? { ...prev, status } : prev));
        }}
        onClose={() => setDetailState(null)}
      />
    </main>
  );
}
