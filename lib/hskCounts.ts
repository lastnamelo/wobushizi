import { getCanonicalCharacter, getHanziData, lookupHanziEntry } from "@/lib/hanzidb";

export type HskCounts = {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
  6: number;
  unknown: number;
};

export function emptyHskCounts(): HskCounts {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, unknown: 0 };
}

export function countHskLevels(rows: Array<{ hsk_level?: unknown }>): HskCounts {
  const counts = emptyHskCounts();
  for (const row of rows) {
    const hsk = typeof row.hsk_level === "number" ? row.hsk_level : null;
    if (hsk && hsk >= 1 && hsk <= 6) counts[hsk as 1 | 2 | 3 | 4 | 5 | 6] += 1;
    else counts.unknown += 1;
  }
  return counts;
}

export function countHskLevelsFromCharacters(characters: string[]): HskCounts {
  const canonical = new Set<string>();
  for (const ch of characters) {
    if (!ch) continue;
    canonical.add(getCanonicalCharacter(ch));
  }

  return countHskLevels(
    [...canonical].map((character) => ({
      hsk_level: lookupHanziEntry(character)?.hsk_level
    }))
  );
}

export const TOTAL_HSK_COUNTS: HskCounts = countHskLevelsFromCharacters(
  getHanziData()
    .map((row) => row.character)
    .filter((ch): ch is string => Boolean(ch))
);
