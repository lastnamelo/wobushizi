import rawData from "@/data/hanzidb.json";
import { HanzidbEntry } from "@/lib/types";
import { getHskTextColor } from "@/lib/hskStyles";

const data = rawData as HanzidbEntry[];

const byCharacter = new Map<string, HanzidbEntry>();
const byAnyVariant = new Map<string, HanzidbEntry>();

function isSimplifiedPreferredRow(row: HanzidbEntry): boolean {
  const trad = typeof row?.traditional_character === "string" ? row.traditional_character.trim() : "";
  return Boolean(trad && trad !== row.character);
}

function rowScoreForVariant(row: HanzidbEntry, key: string): number {
  let score = 0;
  if (isSimplifiedPreferredRow(row)) score += 4;
  if (row.character === key) score += 2;
  return score;
}

function setVariantMapping(key: string, row: HanzidbEntry): void {
  const existing = byAnyVariant.get(key);
  if (!existing) {
    byAnyVariant.set(key, row);
    return;
  }

  const existingScore = rowScoreForVariant(existing, key);
  const nextScore = rowScoreForVariant(row, key);
  if (nextScore > existingScore) {
    byAnyVariant.set(key, row);
  }
}

for (const row of data) {
  if (row?.character) {
    byCharacter.set(row.character, row);
    setVariantMapping(row.character, row);
  }

  const traditional = typeof row?.traditional_character === "string" ? row.traditional_character.trim() : "";
  if (traditional) {
    setVariantMapping(traditional, row);
  }

  const alternates = typeof row?.alternate_characters === "string"
    ? row.alternate_characters.split("|").map((c) => c.trim()).filter(Boolean)
    : [];
  for (const alt of alternates) {
    setVariantMapping(alt, row);
  }
}

export function getHanziData(): HanzidbEntry[] {
  return data;
}

export function getHanziMap(): Map<string, HanzidbEntry> {
  return byCharacter;
}

export function lookupHanziEntry(character: string): HanzidbEntry | undefined {
  return byAnyVariant.get(character);
}

export function getCanonicalCharacter(character: string): string {
  const match = byAnyVariant.get(character);
  if (!match?.character) return character;
  return String(match.character);
}

export function getHskColor(level: number | null | undefined): string {
  return getHskTextColor(level);
}
