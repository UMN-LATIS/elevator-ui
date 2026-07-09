import { describe, it, expect } from "vitest";
import {
  buildEntryValueOptions,
  isEntryValueOptionDisabled,
  type EntryValueOption,
} from "./buildEntryValueOptions";
import type { EntryHint } from "@/types";

const courseHints: EntryHint[] = [
  { value: "12345", label: "ART.1234.001" },
  { value: "23456", label: "CSCI.2021.010" },
];

function optionValues(options: EntryValueOption[]): string[] {
  return options.map((option) =>
    option.kind === "hint" ? option.hint.value : option.value
  );
}

describe("buildEntryValueOptions", () => {
  it("returns all hints and no custom row for an empty draft", () => {
    const options = buildEntryValueOptions({ hints: courseHints, draft: "" });
    expect(optionValues(options)).toEqual(["12345", "23456"]);
    expect(options.every((option) => option.kind === "hint")).toBe(true);
  });

  it("treats a whitespace-only draft as empty", () => {
    const options = buildEntryValueOptions({
      hints: courseHints,
      draft: "   ",
    });
    expect(optionValues(options)).toEqual(["12345", "23456"]);
  });

  it("filters hints case-insensitively on label", () => {
    const options = buildEntryValueOptions({
      hints: courseHints,
      draft: "art",
    });
    expect(optionValues(options)).toEqual(["12345", "art"]);
  });

  it("filters hints on value", () => {
    const options = buildEntryValueOptions({
      hints: courseHints,
      draft: "234",
    });
    // both hint values contain "234", plus the pinned custom row
    expect(optionValues(options)).toEqual(["12345", "23456", "234"]);
  });

  it("pins a custom row offering a wildcard draft verbatim", () => {
    const options = buildEntryValueOptions({
      hints: courseHints,
      draft: "ART-1234-%-FA26",
    });
    expect(options).toContainEqual({
      kind: "custom",
      value: "ART-1234-%-FA26",
    });
  });

  it("offers the custom row even when no hints match", () => {
    const options = buildEntryValueOptions({
      hints: courseHints,
      draft: "zzz",
    });
    expect(options).toEqual([{ kind: "custom", value: "zzz" }]);
  });

  it("suppresses the custom row when the draft exactly equals a hint value", () => {
    const options = buildEntryValueOptions({
      hints: courseHints,
      draft: "12345",
    });
    expect(options).toEqual([{ kind: "hint", hint: courseHints[0] }]);
  });

  it("keeps the custom row when the draft matches a hint value only case-insensitively", () => {
    const hints: EntryHint[] = [{ value: "GRAD", label: "Graduate" }];
    const options = buildEntryValueOptions({ hints, draft: "grad" });
    // values are case-sensitive LIKE patterns, "grad" is a distinct value
    expect(options).toContainEqual({ kind: "custom", value: "grad" });
  });

  it("trims the draft before matching and pinning", () => {
    const options = buildEntryValueOptions({
      hints: courseHints,
      draft: "  12345  ",
    });
    expect(options).toEqual([{ kind: "hint", hint: courseHints[0] }]);
  });

  it("returns only the custom row when there are no hints", () => {
    const options = buildEntryValueOptions({ hints: [], draft: "9403" });
    expect(options).toEqual([{ kind: "custom", value: "9403" }]);
  });
});

describe("isEntryValueOptionDisabled", () => {
  const hintOption: EntryValueOption = {
    kind: "hint",
    hint: { value: "12345", label: "ART.1234.001" },
  };

  it("disables a hint whose value is already an entry", () => {
    expect(isEntryValueOptionDisabled(hintOption, ["12345"])).toBe(true);
  });

  it("leaves a hint enabled when no entry matches exactly", () => {
    expect(isEntryValueOptionDisabled(hintOption, ["999", "1234"])).toBe(false);
  });

  it("never disables the custom row", () => {
    const customOption: EntryValueOption = { kind: "custom", value: "12345" };
    expect(isEntryValueOptionDisabled(customOption, ["12345"])).toBe(false);
  });
});
