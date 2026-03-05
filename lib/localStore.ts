import { CharacterStateRow, CharacterStatus } from "@/lib/types";
import { getCanonicalCharacter, getCharacterFamily } from "@/lib/hanzidb";
import {
  buildCanonicalLogRows,
  needsCanonicalReconcile,
  normalizeRowsByCanonical
} from "@/lib/stateCanonical";
import {
  ensureProfile,
  fetchAllCharacterStates,
  fetchCharacterStatesForChars,
} from "@/lib/db";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";

const LOCAL_USER_ID = "local-user";
const STATE_KEY = "wobushizi:character_states";
const LOG_KEY = "wobushizi:log_events";
let ensuredProfileId: string | null = null;
const reconciledUserIds = new Set<string>();
const LOCAL_RECONCILE_KEY = "wobushizi:local_reconciled_v2";
const RECONCILE_VERSION = "v2";

type StoredState = Record<string, CharacterStateRow>;
export interface LocalLogEvent {
  id: string;
  source_text: string;
  created_at: string;
  items: Array<{ character: string; action: string; created_at: string }>;
}

async function maybeReconcileSupabaseStates(userId: string): Promise<void> {
  if (!supabase || reconciledUserIds.has(userId)) return;
  if (typeof window !== "undefined") {
    const key = `wobushizi:reconciled_user_${RECONCILE_VERSION}:${userId}`;
    if (window.localStorage.getItem(key) === "1") {
      reconciledUserIds.add(userId);
      return;
    }
  }

  const { data, error } = await supabase
    .from("character_states")
    .select("user_id,character,status,last_seen_at,created_at")
    .eq("user_id", userId);
  if (error) throw error;

  const rows = (data ?? []) as CharacterStateRow[];
  if (!needsCanonicalReconcile(rows)) {
    reconciledUserIds.add(userId);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`wobushizi:reconciled_user_${RECONCILE_VERSION}:${userId}`, "1");
    }
    return;
  }

  const normalized = normalizeRowsByCanonical(rows);
  const { error: deleteError } = await supabase.from("character_states").delete().eq("user_id", userId);
  if (deleteError) throw deleteError;

  if (normalized.length > 0) {
    const { error: insertError } = await supabase
      .from("character_states")
      .insert(
        normalized.map((row) => ({
          user_id: userId,
          character: row.character,
          status: row.status,
          last_seen_at: row.last_seen_at,
          created_at: row.created_at
        }))
      );
    if (insertError) throw insertError;
  }

  reconciledUserIds.add(userId);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(`wobushizi:reconciled_user_${RECONCILE_VERSION}:${userId}`, "1");
  }
}

function maybeReconcileLocalStates(): void {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(LOCAL_RECONCILE_KEY) === "1") return;
  const rows = Object.values(readStates());
  if (!needsCanonicalReconcile(rows)) {
    window.localStorage.setItem(LOCAL_RECONCILE_KEY, "1");
    return;
  }
  const normalized = normalizeRowsByCanonical(rows);
  const next: StoredState = {};
  for (const row of normalized) {
    next[row.character] = row;
  }
  writeStates(next);
  window.localStorage.setItem(LOCAL_RECONCILE_KEY, "1");
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
    throw error;
  }
  const user = data.user;
  if (!user) {
    throw new Error("Login required: no active auth session.");
  }

  if (ensuredProfileId !== user.id) {
    await ensureProfile(supabase, user);
    await maybeReconcileSupabaseStates(user.id);
    ensuredProfileId = user.id;
  }
  return user;
}

async function requireAuthUser(): Promise<User> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error("Login required: no active auth session.");
  }
  return user;
}

export async function ensureLocalProfile(): Promise<void> {
  await getAuthUser();
  return;
}

export async function fetchKnownCountLocal(): Promise<number> {
  if (isSupabaseConfigured) {
    const user = await requireAuthUser();
    if (!supabase) throw new Error("Supabase client not available.");
    const rows = await fetchAllCharacterStates(supabase, user.id);
    return normalizeRowsByCanonical(rows).filter((row) => row.status === "known").length;
  }

  const user = await getAuthUser();
  if (user && supabase) {
    const rows = await fetchAllCharacterStates(supabase, user.id);
    return normalizeRowsByCanonical(rows).filter((row) => row.status === "known").length;
  }
  maybeReconcileLocalStates();

  return normalizeRowsByCanonical(Object.values(readStates())).filter((row) => row.status === "known").length;
}

export async function fetchCharacterStatesForCharsLocal(
  characters: string[]
): Promise<Map<string, CharacterStateRow>> {
  const canonicalByInput = new Map<string, string>();
  for (const ch of characters) {
    canonicalByInput.set(ch, getCanonicalCharacter(ch));
  }
  const uniqueCanonical = [...new Set(canonicalByInput.values())];

  if (isSupabaseConfigured) {
    const user = await requireAuthUser();
    if (!supabase) throw new Error("Supabase client not available.");
    const canonicalMap = await fetchCharacterStatesForChars(supabase, user.id, uniqueCanonical);
    const normalized = normalizeRowsByCanonical([...canonicalMap.values()]);
    const byCanonical = new Map(normalized.map((row) => [row.character, row]));
    const result = new Map<string, CharacterStateRow>();
    for (const [input, canonical] of canonicalByInput.entries()) {
      const row = byCanonical.get(canonical);
      if (row) result.set(input, row);
    }
    return result;
  }

  const user = await getAuthUser();
  if (user && supabase) {
    const canonicalMap = await fetchCharacterStatesForChars(supabase, user.id, uniqueCanonical);
    const normalized = normalizeRowsByCanonical([...canonicalMap.values()]);
    const byCanonical = new Map(normalized.map((row) => [row.character, row]));
    const result = new Map<string, CharacterStateRow>();
    for (const [input, canonical] of canonicalByInput.entries()) {
      const row = byCanonical.get(canonical);
      if (row) result.set(input, row);
    }
    return result;
  }
  maybeReconcileLocalStates();

  const byCanonical = new Map(
    normalizeRowsByCanonical(Object.values(readStates())).map((row) => [row.character, row])
  );
  const result = new Map<string, CharacterStateRow>();
  for (const [input, canonical] of canonicalByInput.entries()) {
    const row = byCanonical.get(canonical);
    if (row) result.set(input, row);
  }

  return result;
}

export async function fetchCharacterStatesByStatusLocal(
  status: CharacterStatus
): Promise<CharacterStateRow[]> {
  if (isSupabaseConfigured) {
    const user = await requireAuthUser();
    if (!supabase) throw new Error("Supabase client not available.");
    const rows = await fetchAllCharacterStates(supabase, user.id);
    return normalizeRowsByCanonical(rows).filter((row) => row.status === status);
  }

  const user = await getAuthUser();
  if (user && supabase) {
    const rows = await fetchAllCharacterStates(supabase, user.id);
    return normalizeRowsByCanonical(rows).filter((row) => row.status === status);
  }
  maybeReconcileLocalStates();

  return normalizeRowsByCanonical(Object.values(readStates())).filter((row) => row.status === status);
}

export async function fetchAllCharacterStatesLocal(): Promise<CharacterStateRow[]> {
  if (isSupabaseConfigured) {
    const user = await requireAuthUser();
    if (!supabase) throw new Error("Supabase client not available.");
    return normalizeRowsByCanonical(await fetchAllCharacterStates(supabase, user.id));
  }

  const user = await getAuthUser();
  if (user && supabase) {
    return normalizeRowsByCanonical(await fetchAllCharacterStates(supabase, user.id));
  }
  maybeReconcileLocalStates();

  return normalizeRowsByCanonical(Object.values(readStates()));
}

export async function setCharacterStatusLocal(
  character: string,
  status: CharacterStatus,
  timestamp = new Date().toISOString()
): Promise<void> {
  const canonical = getCanonicalCharacter(character);
  const family = getCharacterFamily(canonical);
  const variantChars = family.filter((ch) => ch !== canonical);
  if (isSupabaseConfigured) {
    const user = await requireAuthUser();
    if (!supabase) throw new Error("Supabase client not available.");
    if (variantChars.length > 0) {
      const { error: deleteVariantsError } = await supabase
        .from("character_states")
        .delete()
        .eq("user_id", user.id)
        .in("character", variantChars);
      if (deleteVariantsError) throw deleteVariantsError;
    }
    const { error } = await supabase
      .from("character_states")
      .upsert(
        {
          user_id: user.id,
          character: canonical,
          status,
          last_seen_at: timestamp
        },
        { onConflict: "user_id,character" }
      );
    if (error) throw error;
    return;
  }

  const user = await getAuthUser();
  if (user && supabase) {
    if (variantChars.length > 0) {
      const { error: deleteVariantsError } = await supabase
        .from("character_states")
        .delete()
        .eq("user_id", user.id)
        .in("character", variantChars);
      if (deleteVariantsError) throw deleteVariantsError;
    }
    const { error } = await supabase
      .from("character_states")
      .upsert(
        {
          user_id: user.id,
          character: canonical,
          status,
          last_seen_at: timestamp
        },
        { onConflict: "user_id,character" }
      );
    if (error) throw error;
    return;
  }

  const states = readStates();
  for (const ch of variantChars) {
    delete states[ch];
  }
  states[canonical] = {
    user_id: LOCAL_USER_ID,
    character: canonical,
    status,
    last_seen_at: timestamp,
    created_at: states[canonical]?.created_at ?? timestamp
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
  if (isSupabaseConfigured) {
    const user = await requireAuthUser();
    if (!supabase) throw new Error("Supabase client not available.");
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
      const canonicalRows = buildCanonicalLogRows(uniqueChars, knownSet, selectedSet);
      const stateRows = canonicalRows.map((row) => ({
        user_id: user.id,
        character: row.character,
        status: row.status,
        last_seen_at: now
      }));

      const { error: upsertError } = await supabase
        .from("character_states")
        .upsert(stateRows, { onConflict: "user_id,character" });
      if (upsertError) throw upsertError;

      const eventItemRows = canonicalRows.map((row) => {
        return {
          log_event_id: logEvent.id,
          user_id: user.id,
          character: row.character,
          action: row.action,
          created_at: now
        };
      });

      const { error: eventItemsError } = await supabase.from("log_event_items").insert(eventItemRows);
      if (eventItemsError) throw eventItemsError;
    }

    return;
  }

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
      const canonicalRows = buildCanonicalLogRows(uniqueChars, knownSet, selectedSet);
      const stateRows = canonicalRows.map((row) => ({
        user_id: user.id,
        character: row.character,
        status: row.status,
        last_seen_at: now
      }));

      const { error: upsertError } = await supabase
        .from("character_states")
        .upsert(stateRows, { onConflict: "user_id,character" });
      if (upsertError) throw upsertError;

      const eventItemRows = canonicalRows.map((row) => {
        return {
          log_event_id: logEvent.id,
          user_id: user.id,
          character: row.character,
          action: row.action,
          created_at: now
        };
      });

      const { error: eventItemsError } = await supabase.from("log_event_items").insert(eventItemRows);
      if (eventItemsError) throw eventItemsError;
    }

    return;
  }

  const states = readStates();

  const canonicalRows = buildCanonicalLogRows(uniqueChars, knownSet, selectedSet);
  for (const row of canonicalRows) {
    states[row.character] = {
      user_id: LOCAL_USER_ID,
      character: row.character,
      status: row.status,
      last_seen_at: now,
      created_at: states[row.character]?.created_at ?? now
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
      items: canonicalRows.map((row) => ({ character: row.character, action: row.action, created_at: now }))
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
