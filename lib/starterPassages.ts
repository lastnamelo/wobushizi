export interface StarterPassage {
  id: string;
  title: string;
  path: string;
}

export const STARTER_PASSAGES: StarterPassage[] = [
  { id: "origin", title: "Origin Story", path: "/starter-passages/01-origin-story.txt" },
  { id: "blast", title: "Chinese 100 Blast", path: "/starter-passages/02-chinese-100-blast.txt" },
  { id: "faq", title: "FAQ Style", path: "/starter-passages/03-faq-style.txt" },
  { id: "idioms", title: "Philosophical Idioms", path: "/starter-passages/04-philosophical-idioms.txt" },
  { id: "ai", title: "How I Built This With AI", path: "/starter-passages/05-ai-build-story.txt" }
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

