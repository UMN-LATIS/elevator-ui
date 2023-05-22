export function pluralize(count: number, word: string, pluralWord?: string) {
  if (pluralWord) {
    return count === 1 ? word : pluralWord;
  }

  return count === 1 ? word : `${word}s`;
}
