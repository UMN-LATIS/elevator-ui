import { describe, it, expect } from "vitest";
import { hasDateContent } from "./hasWidgetContent";
import type { DateWidgetContent } from "@/types";

const makeDateContent = (
  overrides: Partial<DateWidgetContent> = {}
): DateWidgetContent => ({
  label: "",
  start: { text: null, numeric: null },
  end: { text: null, numeric: null },
  ...overrides,
});

describe("hasDateContent", () => {
  it("does not count a label as content", () => {
    const labelWithNoDates = makeDateContent({ label: "Date created" });
    expect(hasDateContent([labelWithNoDates])).toBe(false);
  });

  it("counts a start date as content", () => {
    const startOnly = makeDateContent({
      start: { text: "2024-01-01", numeric: "1704067200" },
    });
    expect(hasDateContent([startOnly])).toBe(true);
  });

  it("counts an end date as content", () => {
    const endOnly = makeDateContent({
      end: { text: "2024-01-02", numeric: "1704153600" },
    });
    expect(hasDateContent([endOnly])).toBe(true);
  });

  it("counts whitespace as no content", () => {
    const whitespaceStart = makeDateContent({
      start: { text: "   ", numeric: null },
    });
    expect(hasDateContent([whitespaceStart])).toBe(false);
  });

  it("returns false for an untouched date item", () => {
    expect(hasDateContent([makeDateContent()])).toBe(false);
  });

  it("returns false when there are no items at all", () => {
    expect(hasDateContent([])).toBe(false);
  });
});
