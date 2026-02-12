const HAN_REGEX = /\p{Script=Han}/u;

export function isChineseChar(char: string): boolean {
  return HAN_REGEX.test(char);
}

export function extractUniqueChineseChars(input: string): string[] {
  const unique = new Set<string>();
  for (const ch of input) {
    if (isChineseChar(ch)) {
      unique.add(ch);
    }
  }
  return [...unique];
}
