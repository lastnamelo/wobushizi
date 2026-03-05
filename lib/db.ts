import { SupabaseClient, User } from "@supabase/supabase-js";
import { CharacterStateRow, CharacterStatus } from "@/lib/types";

export async function ensureProfile(
  client: SupabaseClient,
  user: User
): Promise<void> {
  const { error } = await client.from("profiles").upsert({ id: user.id });
  if (error) {
    throw error;
  }
}

export async function fetchKnownCount(
  client: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await client
    .from("character_states")
    .select("character", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "known");

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function fetchCharacterStatesForChars(
  client: SupabaseClient,
  userId: string,
  characters: string[]
): Promise<Map<string, CharacterStateRow>> {
  if (characters.length === 0) {
    return new Map();
  }

  const { data, error } = await client
    .from("character_states")
    .select("user_id,character,status,last_seen_at,created_at")
    .eq("user_id", userId)
    .in("character", characters);

  if (error) {
    throw error;
  }

  const map = new Map<string, CharacterStateRow>();
  for (const row of (data ?? []) as CharacterStateRow[]) {
    map.set(row.character, row);
  }
  return map;
}

export async function fetchCharacterStatesByStatus(
  client: SupabaseClient,
  userId: string,
  status: CharacterStatus
): Promise<CharacterStateRow[]> {
  const { data, error } = await client
    .from("character_states")
    .select("user_id,character,status,last_seen_at,created_at")
    .eq("user_id", userId)
    .eq("status", status)
    .order("character", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as CharacterStateRow[];
}

export async function fetchAllCharacterStates(
  client: SupabaseClient,
  userId: string
): Promise<CharacterStateRow[]> {
  const pageSize = 1000;
  let from = 0;
  const all: CharacterStateRow[] = [];

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await client
      .from("character_states")
      .select("user_id,character,status,last_seen_at,created_at")
      .eq("user_id", userId)
      .order("character", { ascending: true })
      .range(from, to);

    if (error) {
      throw error;
    }

    const chunk = (data ?? []) as CharacterStateRow[];
    all.push(...chunk);
    if (chunk.length < pageSize) break;
    from += pageSize;
  }

  return all;
}
