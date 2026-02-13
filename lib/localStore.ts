import { CharacterStateRow, CharacterStatus } from "@/lib/types";

const LOCAL_USER_ID = "local-user";
const STATE_KEY = "wobushizi:character_states";
const LOG_KEY = "wobushizi:log_events";

type StoredState = Record<string, CharacterStateRow>;
export interface LocalLogEvent {
  id: string;
  source_text: string;
  created_at: string;
  items: Array<{ character: string; action: string; created_at: string }>;
}

function readStates(): StoredState {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(STATE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as StoredState;
  } catch {
    return {};
  }
}

function writeStates(states: StoredState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STATE_KEY, JSON.stringify(states));
}

export async function ensureLocalProfile(): Promise<void> {
  return;
}

export async function fetchKnownCountLocal(): Promise<number> {
  const states = readStates();
  return Object.values(states).filter((row) => row.status === "known").length;
}

export async function fetchCharacterStatesForCharsLocal(
  characters: string[]
): Promise<Map<string, CharacterStateRow>> {
  const states = readStates();
  const map = new Map<string, CharacterStateRow>();

  for (const ch of characters) {
    const row = states[ch];
    if (row) map.set(ch, row);
  }

  return map;
}

export async function fetchCharacterStatesByStatusLocal(
  status: CharacterStatus
): Promise<CharacterStateRow[]> {
  const states = readStates();
  return Object.values(states)
    .filter((row) => row.status === status)
    .sort((a, b) => a.character.localeCompare(b.character, "zh-Hans-CN"));
}

export async function fetchAllCharacterStatesLocal(): Promise<CharacterStateRow[]> {
  const states = readStates();
  return Object.values(states);
}

export async function setCharacterStatusLocal(
  character: string,
  status: CharacterStatus,
  timestamp = new Date().toISOString()
): Promise<void> {
  const states = readStates();
  states[character] = {
    user_id: LOCAL_USER_ID,
    character,
    status,
    last_seen_at: timestamp,
    created_at: states[character]?.created_at ?? timestamp
  };
  writeStates(states);
}

export async function applyLogLocal(
  sourceText: string,
  uniqueChars: string[],
  knownSet: Set<string>,
  selectedSet: Set<string>
): Promise<void> {
  const now = new Date().toISOString();
  const states = readStates();

  for (const character of uniqueChars) {
    const status: CharacterStatus = selectedSet.has(character) ? "known" : "study";
    states[character] = {
      user_id: LOCAL_USER_ID,
      character,
      status,
      last_seen_at: now,
      created_at: states[character]?.created_at ?? now
    };
  }

  writeStates(states);

  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem(LOG_KEY);
    const logs = raw ? (JSON.parse(raw) as LocalLogEvent[]) : [];
    logs.push({
      id: crypto.randomUUID(),
      source_text: sourceText,
      created_at: now,
      items: uniqueChars.map((character) => {
        const alreadyKnown = knownSet.has(character);
        const selected = selectedSet.has(character);
        const action = alreadyKnown ? "skipped" : selected ? "logged_known" : "queued_study";
        const normalizedAction = !selected ? "queued_study" : action;
        return { character, action: normalizedAction, created_at: now };
      })
    });
    window.localStorage.setItem(LOG_KEY, JSON.stringify(logs));
  }
}

export async function fetchLogEventsLocal(): Promise<LocalLogEvent[]> {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(LOG_KEY);
  if (!raw) return [];
  try {
    const rows = JSON.parse(raw) as LocalLogEvent[];
    return rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  } catch {
    return [];
  }
}

export async function resetLocalProgress(): Promise<void> {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STATE_KEY);
  window.localStorage.removeItem(LOG_KEY);
}
