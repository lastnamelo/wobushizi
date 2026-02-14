import { CharacterStateRow, CharacterStatus } from "@/lib/types";
import {
  ensureProfile,
  fetchAllCharacterStates,
  fetchCharacterStatesByStatus,
  fetchCharacterStatesForChars,
  fetchKnownCount
} from "@/lib/db";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

const LOCAL_USER_ID = "local-user";
const STATE_KEY = "wobushizi:character_states";
const LOG_KEY = "wobushizi:log_events";
let ensuredProfileId: string | null = null;

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

async function getAuthUser() {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    // No authenticated session is valid in demo/browse mode; fall back to local persistence.
    if (/auth session missing/i.test(error.message)) {
      return null;
    }
    throw error;
  }
  const user = data.user;
  if (!user) return null;

  if (ensuredProfileId !== user.id) {
    await ensureProfile(supabase, user);
    ensuredProfileId = user.id;
  }
  return user;
}

export async function ensureLocalProfile(): Promise<void> {
  await getAuthUser();
  return;
}

export async function fetchKnownCountLocal(): Promise<number> {
  const user = await getAuthUser();
  if (user && supabase) {
    return fetchKnownCount(supabase, user.id);
  }

  const states = readStates();
  return Object.values(states).filter((row) => row.status === "known").length;
}

export async function fetchCharacterStatesForCharsLocal(
  characters: string[]
): Promise<Map<string, CharacterStateRow>> {
  const user = await getAuthUser();
  if (user && supabase) {
    return fetchCharacterStatesForChars(supabase, user.id, characters);
  }

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
  const user = await getAuthUser();
  if (user && supabase) {
    return fetchCharacterStatesByStatus(supabase, user.id, status);
  }

  const states = readStates();
  return Object.values(states)
    .filter((row) => row.status === status)
    .sort((a, b) => a.character.localeCompare(b.character, "zh-Hans-CN"));
}

export async function fetchAllCharacterStatesLocal(): Promise<CharacterStateRow[]> {
  const user = await getAuthUser();
  if (user && supabase) {
    return fetchAllCharacterStates(supabase, user.id);
  }

  const states = readStates();
  return Object.values(states);
}

export async function setCharacterStatusLocal(
  character: string,
  status: CharacterStatus,
  timestamp = new Date().toISOString()
): Promise<void> {
  const user = await getAuthUser();
  if (user && supabase) {
    const { error } = await supabase
      .from("character_states")
      .upsert(
        {
          user_id: user.id,
          character,
          status,
          last_seen_at: timestamp
        },
        { onConflict: "user_id,character" }
      );
    if (error) throw error;
    return;
  }

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
  const user = await getAuthUser();

  if (user && supabase) {
    const { data: logEvent, error: logError } = await supabase
      .from("log_events")
      .insert({
        user_id: user.id,
        source_text: sourceText
      })
      .select("id")
      .single();
    if (logError) throw logError;

    if (uniqueChars.length > 0) {
      const stateRows = uniqueChars.map((character) => ({
        user_id: user.id,
        character,
        status: (selectedSet.has(character) ? "known" : "study") as CharacterStatus,
        last_seen_at: now
      }));

      const { error: upsertError } = await supabase
        .from("character_states")
        .upsert(stateRows, { onConflict: "user_id,character" });
      if (upsertError) throw upsertError;

      const eventItemRows = uniqueChars.map((character) => {
        const alreadyKnown = knownSet.has(character);
        const selected = selectedSet.has(character);
        const action = alreadyKnown ? "skipped" : selected ? "logged_known" : "queued_study";
        const normalizedAction = !selected ? "queued_study" : action;
        return {
          log_event_id: logEvent.id,
          user_id: user.id,
          character,
          action: normalizedAction,
          created_at: now
        };
      });

      const { error: eventItemsError } = await supabase.from("log_event_items").insert(eventItemRows);
      if (eventItemsError) throw eventItemsError;
    }

    return;
  }

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
  const user = await getAuthUser();
  if (user && supabase) {
    const [{ data: logs, error: logsError }, { data: items, error: itemsError }] = await Promise.all([
      supabase
        .from("log_events")
        .select("id,source_text,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("log_event_items")
        .select("log_event_id,character,action,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
    ]);

    if (logsError) throw logsError;
    if (itemsError) throw itemsError;

    const byLogId = new Map<string, LocalLogEvent>();
    for (const row of logs ?? []) {
      byLogId.set(row.id, {
        id: row.id,
        source_text: row.source_text,
        created_at: row.created_at,
        items: []
      });
    }

    for (const item of items ?? []) {
      const target = byLogId.get(item.log_event_id);
      if (!target) continue;
      target.items.push({
        character: item.character,
        action: item.action,
        created_at: item.created_at
      });
    }

    return [...byLogId.values()].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }

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
  const user = await getAuthUser();
  if (user && supabase) {
    const [itemsDel, logsDel, statesDel] = await Promise.all([
      supabase.from("log_event_items").delete().eq("user_id", user.id),
      supabase.from("log_events").delete().eq("user_id", user.id),
      supabase.from("character_states").delete().eq("user_id", user.id)
    ]);

    if (itemsDel.error) throw itemsDel.error;
    if (logsDel.error) throw logsDel.error;
    if (statesDel.error) throw statesDel.error;
  }

  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STATE_KEY);
  window.localStorage.removeItem(LOG_KEY);
}
