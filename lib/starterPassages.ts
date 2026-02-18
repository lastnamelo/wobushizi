export interface StarterPassage {
  id: string;
  title: string;
  path: string;
}

export const STARTER_PASSAGES: StarterPassage[] = [
  { id: "welcome", title: "Welcome (Easy)", path: "/starter-passages/00-welcome.txt" },
  { id: "chinese101", title: "Chinese 101 Throwback (Easy)", path: "/starter-passages/02-chinese-101.txt" },
  { id: "tips", title: "Tips (Medium)", path: "/starter-passages/01-tips.txt" }
];

const NEXT_INDEX_KEY = "wobushizi:starter_passage_next_index";

export function getNextStarterPassageIndex(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(NEXT_INDEX_KEY);
  const parsed = raw == null ? Number.NaN : Number(raw);
  if (!Number.isInteger(parsed) || parsed < 0) return 0;
  return parsed % STARTER_PASSAGES.length;
}

export function bumpStarterPassageIndex(current: number): void {
  if (typeof window === "undefined") return;
  const next = (current + 1) % STARTER_PASSAGES.length;
  window.localStorage.setItem(NEXT_INDEX_KEY, String(next));
}
