const PINYIN_FOLD_MAP: Record<string, string> = {
  // a
  "ā": "a",
  "á": "a",
  "ǎ": "a",
  "à": "a",
  "Ā": "a",
  "Á": "a",
  "Ǎ": "a",
  "À": "a",
  // e
  "ē": "e",
  "é": "e",
  "ě": "e",
  "è": "e",
  "Ē": "e",
  "É": "e",
  "Ě": "e",
  "È": "e",
  // i
  "ī": "i",
  "í": "i",
  "ǐ": "i",
  "ì": "i",
  "Ī": "i",
  "Í": "i",
  "Ǐ": "i",
  "Ì": "i",
  // o
  "ō": "o",
  "ó": "o",
  "ǒ": "o",
  "ò": "o",
  "Ō": "o",
  "Ó": "o",
  "Ǒ": "o",
  "Ò": "o",
  // u
  "ū": "u",
  "ú": "u",
  "ǔ": "u",
  "ù": "u",
  "Ū": "u",
  "Ú": "u",
  "Ǔ": "u",
  "Ù": "u",
  // u-umlaut (v)
  "ü": "u",
  "ǖ": "u",
  "ǘ": "u",
  "ǚ": "u",
  "ǜ": "u",
  "Ü": "u",
  "Ǖ": "u",
  "Ǘ": "u",
  "Ǚ": "u",
  "Ǜ": "u",
  // occasional ê
  "ê": "e",
  "Ê": "e"
};

function foldPinyinChars(value: string): string {
  let out = "";
  for (const ch of value) {
    out += PINYIN_FOLD_MAP[ch] ?? ch;
  }
  return out;
}

export function normalizePinyin(value: string): string {
  const normalized = foldPinyinChars(value.normalize("NFKC"));
  const stripped = normalized
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ü/g, "u")
    .replace(/Ü/g, "u");

  return stripped
    .toLowerCase()
    .replace(/[0-9]/g, "")
    .replace(/[^a-z]/g, "");
}

export function tokenizePinyin(value: string): string[] {
  const normalized = foldPinyinChars(value.normalize("NFKC"));
  const stripped = normalized
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ü/g, "u")
    .replace(/Ü/g, "u")
    .toLowerCase()
    .replace(/[0-9]/g, " ");

  return stripped.split(/[^a-z]+/).map((s) => s.trim()).filter(Boolean);
}
