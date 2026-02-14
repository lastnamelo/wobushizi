export type CharacterStatus = "known" | "study";

export interface HanzidbEntry {
  character: string;
  traditional_character?: string;
  alternate_characters?: string;
  pinyin?: string;
  pinyin_alternates?: string;
  common_word_1?: string;
  common_word_1_pinyin?: string;
  common_word_1_definition?: string;
  common_word_2?: string;
  common_word_2_pinyin?: string;
  common_word_2_definition?: string;
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
  alternate_characters?: string;
  pinyin?: string;
  pinyin_alternates?: string;
  common_word_1?: string;
  common_word_1_pinyin?: string;
  common_word_1_definition?: string;
  common_word_2?: string;
  common_word_2_pinyin?: string;
  common_word_2_definition?: string;
  hsk_level?: number | null;
  frequency?: number | null;
  definition?: string;
}
