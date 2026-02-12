export type CharacterStatus = "known" | "study";

export interface HanzidbEntry {
  character: string;
  traditional_character?: string;
  pinyin?: string;
  definition?: string;
  hsk_level?: number | null;
  [key: string]: unknown;
}

export interface CharacterStateRow {
  user_id: string;
  character: string;
  status: CharacterStatus;
  last_seen_at: string | null;
  created_at?: string;
}

export interface LogEventRow {
  id: string;
  user_id: string;
  source_text: string;
  created_at: string;
}

export interface EnrichedCharacter {
  character: string;
  status?: CharacterStatus;
  traditional_character?: string;
  pinyin?: string;
  hsk_level?: number | null;
  frequency?: number | null;
  definition?: string;
}
