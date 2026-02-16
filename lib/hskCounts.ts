import { getHanziData } from "@/lib/hanzidb";

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

export const TOTAL_HSK_COUNTS: HskCounts = countHskLevels(getHanziData());

