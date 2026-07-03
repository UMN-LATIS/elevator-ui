import type { EntryHint } from "@/types";

// A row in the entry value dropdown: a hint to pick, or the pinned row
// offering whatever was typed, so wildcards like "ART-1234-%-FA26" are
// always selectable.
export type EntryValueOption =
  | { kind: "hint"; hint: EntryHint }
  | { kind: "custom"; value: string };

/**
 * Builds the dropdown options for an entry value draft.
 *
 * An empty draft returns every hint (the field shows all choices on
 * focus). A non-empty draft filters hints case-insensitively on value
 * and label, then pins a custom row offering the draft verbatim, unless
 * the draft already exactly equals a hint's value. Exact-match checks
 * are case-sensitive because entry values are LIKE patterns server-side.
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

// A hint already present in the group is shown but not selectable. The
// custom row never disables, duplicates are the server's call.
export function isEntryValueOptionDisabled(
  option: EntryValueOption,
  existingValues: string[]
): boolean {
  if (option.kind === "custom") return false;
  return existingValues.includes(option.hint.value);
}
