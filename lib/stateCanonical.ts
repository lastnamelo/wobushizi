import { getCanonicalCharacter } from "@/lib/hanzidb";
import { CharacterStateRow, CharacterStatus } from "@/lib/types";

export function rowSortTimestamp(row: CharacterStateRow): string {
  return row.last_seen_at ?? row.created_at ?? "";
}

export function normalizeRowsByCanonical(rows: CharacterStateRow[]): CharacterStateRow[] {
  const byCanonical = new Map<string, CharacterStateRow>();

  for (const row of rows) {
    const canonical = getCanonicalCharacter(row.character);
    const next: CharacterStateRow = { ...row, character: canonical };
    const existing = byCanonical.get(canonical);
    if (!existing) {
      byCanonical.set(canonical, next);
      continue;
    }
    if (rowSortTimestamp(next) > rowSortTimestamp(existing)) {
      byCanonical.set(canonical, next);
    }
  }

  return [...byCanonical.values()].sort((a, b) => a.character.localeCompare(b.character, "zh-Hans-CN"));
}

export function needsCanonicalReconcile(rows: CharacterStateRow[]): boolean {
  const seenCanonical = new Set<string>();
  for (const row of rows) {
    const canonical = getCanonicalCharacter(row.character);
    if (row.character !== canonical) return true;
    if (seenCanonical.has(canonical)) return true;
    seenCanonical.add(canonical);
  }
  return false;
}

export type CanonicalLogRow = {
  character: string;
  status: CharacterStatus;
  action: "skipped" | "logged_known" | "queued_study";
};

export function buildCanonicalLogRows(
  uniqueChars: string[],
  knownSet: Set<string>,
  selectedSet: Set<string>
): CanonicalLogRow[] {
  const aggregate = new Map<
    string,
    { alreadyKnown: boolean; selectedCount: number; deselectedCount: number }
  >();

  for (const character of uniqueChars) {
    const canonical = getCanonicalCharacter(character);
    const prev = aggregate.get(canonical) ?? {
      alreadyKnown: false,
      selectedCount: 0,
      deselectedCount: 0
    };
    prev.alreadyKnown = prev.alreadyKnown || knownSet.has(character);
    if (selectedSet.has(character)) prev.selectedCount += 1;
    else prev.deselectedCount += 1;
    aggregate.set(canonical, prev);
  }

  const rows: CanonicalLogRow[] = [];

  for (const [character, summary] of aggregate.entries()) {
    // If any seen variant is explicitly deselected in this log, treat canonical as study.
    const status: CharacterStatus = summary.deselectedCount > 0 ? "study" : "known";
    const action =
      status === "study" ? "queued_study" : summary.alreadyKnown ? "skipped" : "logged_known";
    rows.push({ character, status, action });
  }

  return rows;
}
