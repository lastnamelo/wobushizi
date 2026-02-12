"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/Logo";
import {
  ensureLocalProfile,
  fetchAllCharacterStatesLocal,
  setCharacterStatusLocal
} from "@/lib/localStore";
import { getHanziData } from "@/lib/hanzidb";
import { CharacterStatus, EnrichedCharacter, HanzidbEntry } from "@/lib/types";

const allRows = getHanziData();

function toDisplayRow(row: HanzidbEntry, status: CharacterStatus | "none"): EnrichedCharacter {
  return {
    character: row.character,
    status: status === "none" ? undefined : status,
    traditional_character:
      row.traditional_character && row.traditional_character !== row.character
        ? String(row.traditional_character)
        : "",
    pinyin: row.pinyin ? String(row.pinyin) : "",
    hsk_level: typeof row.hsk_level === "number" ? row.hsk_level : null,
    frequency: typeof row.frequency === "number" ? row.frequency : null,
    definition: row.definition ? String(row.definition) : ""
  };
}

export default function MasterPage() {
  const [loading, setLoading] = useState(true);
  const [stateMap, setStateMap] = useState<Map<string, CharacterStatus>>(new Map());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "known" | "study" | "none">("all");
  const [hskFilter, setHskFilter] = useState<string>("all");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      await ensureLocalProfile();
      const states = await fetchAllCharacterStatesLocal();
      const map = new Map<string, CharacterStatus>();
      for (const row of states) {
        map.set(row.character, row.status);
      }
      setStateMap(map);
      setLoading(false);
    })().catch((err: Error) => {
      setMessage(err.message);
      setLoading(false);
    });
  }, []);

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return allRows
      .filter((row) => {
        if (!row.character) return false;

        const status = stateMap.get(row.character) ?? "none";
        const hsk = typeof row.hsk_level === "number" ? String(row.hsk_level) : "unknown";

        if (statusFilter !== "all" && status !== statusFilter) return false;
        if (hskFilter !== "all" && hsk !== hskFilter) return false;
        if (!query) return true;

        return (
          row.character.includes(query) ||
          String(row.pinyin ?? "").toLowerCase().includes(query) ||
          String(row.definition ?? "").toLowerCase().includes(query)
        );
      })
      .sort((a, b) => a.character.localeCompare(b.character, "zh-Hans-CN"))
      .map((row) => toDisplayRow(row, stateMap.get(row.character) ?? "none"));
  }, [search, statusFilter, hskFilter, stateMap]);

  async function setStatus(character: string, status: CharacterStatus) {
    await setCharacterStatusLocal(character, status);

    setStateMap((prev) => {
      const next = new Map(prev);
      next.set(character, status);
      return next;
    });
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex justify-end gap-2 text-sm">
        <Link href="/about" className="rounded-lg border border-line px-3 py-1.5 hover:bg-white">
          About
        </Link>
        <Link href="/" className="rounded-lg border border-line px-3 py-1.5 hover:bg-white">
          Home
        </Link>
        <Link href="/bank" className="rounded-lg border border-line px-3 py-1.5 hover:bg-white">
          Bank
        </Link>
      </div>

      <Logo />
      <p className="mt-3 text-center text-sm text-stone-600">Master list of all characters</p>

      {loading ? <p className="mt-6 text-center text-stone-600">Loading...</p> : null}

      {!loading ? (
        <section className="mt-8 rounded-2xl border border-line bg-white p-4 shadow-card">
          <div className="mb-4 flex flex-wrap gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search character / pinyin / definition"
              className="min-w-64 flex-1 rounded-lg border border-line bg-stone-50 px-3 py-2 text-sm outline-none focus:border-stone-400"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "known" | "study" | "none")}
              className="rounded-lg border border-line bg-stone-50 px-3 py-2 text-sm"
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
          </div>

          <div className="table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-stone-500">
                  <th className="border-b border-line py-2">字</th>
                  <th className="border-b border-line py-2">繁</th>
                  <th className="border-b border-line py-2">Pinyin</th>
                  <th className="border-b border-line py-2">HSK</th>
                  <th className="border-b border-line py-2">Status</th>
                  <th className="border-b border-line py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.character} className="border-b border-stone-100">
                    <td className="py-2 text-lg">{row.character}</td>
                    <td className="py-2">{row.traditional_character || "-"}</td>
                    <td className="py-2">{row.pinyin || "-"}</td>
                    <td className="py-2">{row.hsk_level ?? "-"}</td>
                    <td className="py-2">{row.status ?? "none"}</td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setStatus(row.character, "known")}
                          className="rounded-lg border border-line px-2 py-1 text-xs hover:bg-stone-100"
                        >
                          Set known
                        </button>
                        <button
                          onClick={() => setStatus(row.character, "study")}
                          className="rounded-lg border border-line px-2 py-1 text-xs hover:bg-stone-100"
                        >
                          Set study
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs text-stone-500">Showing {visibleRows.length.toLocaleString()} characters.</p>
          {message ? <p className="mt-2 text-sm text-rose-700">{message}</p> : null}
        </section>
      ) : null}
    </main>
  );
}
