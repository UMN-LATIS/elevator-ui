import type { EntryHint } from "@/types";

export type EntryValueOption =
  | { kind: "hint"; hint: EntryHint }
  | { kind: "custom"; value: string };

/**
 * Builds the dropdown options for an entry value draft.
 */
export function buildEntryValueOptions(input: {
  hints: EntryHint[];
  draft: string;
}): EntryValueOption[] {
  const query = input.draft.trim();

  if (query === "") {
    return input.hints.map(toHintOption);
  }

  const lowerQuery = query.toLowerCase();
  const matchesQuery = (hint: EntryHint): boolean =>
    hint.value.toLowerCase().includes(lowerQuery) ||
    hint.label.toLowerCase().includes(lowerQuery);

  const options: EntryValueOption[] = input.hints
    .filter(matchesQuery)
    .map(toHintOption);

  const isExactHintValue = input.hints.some((hint) => hint.value === query);
  if (!isExactHintValue) {
    options.push({ kind: "custom", value: query });
  }

  return options;
}

function toHintOption(hint: EntryHint): EntryValueOption {
  return { kind: "hint", hint };
}

export function isEntryValueOptionDisabled(
  option: EntryValueOption,
  existingValues: string[]
): boolean {
  // never disable "custom" (non-hint) entries
  if (option.kind === "custom") return false;
  return existingValues.includes(option.hint.value);
}
