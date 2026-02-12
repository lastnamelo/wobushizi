import rawData from "@/data/hanzidb.json";
import { HanzidbEntry } from "@/lib/types";

const data = rawData as HanzidbEntry[];

const byCharacter = new Map<string, HanzidbEntry>();

for (const row of data) {
  if (row?.character) {
    byCharacter.set(row.character, row);
  }
}

export function getHanziData(): HanzidbEntry[] {
  return data;
}

export function getHanziMap(): Map<string, HanzidbEntry> {
  return byCharacter;
}

export function getHskColor(level: number | null | undefined): string {
  switch (level) {
    case 1:
      return "text-amber-700";
    case 2:
      return "text-emerald-700";
    case 3:
      return "text-sky-700";
    case 4:
      return "text-indigo-700";
    case 5:
      return "text-rose-700";
    case 6:
      return "text-orange-700";
    default:
      return "text-stone-500";
  }
}
