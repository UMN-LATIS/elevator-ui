import { describe, it, expect } from "vitest";
import {
  hasUploadContent,
  hasDateContent,
  hasTagListContent,
} from "./hasWidgetContent";

describe("hasUploadContent", () => {
  // Reproduces #554. A CSV-imported file can carry fileDescription: null
  // instead of "", so the required-field check must key off the file itself,
  // not its description.
  it("counts an upload with a null fileDescription as content", () => {
    const contents = [
      {
        fileId: "5892726de758ae8a198b47be",
        fileType: "jpg",
        fileDescription: null,
        isPrimary: false,
      },
    ];

    expect(hasUploadContent(contents)).toBe(true);
  });

  it("does not count an upload with an empty fileId as content", () => {
    const contents = [
      {
        fileId: "",
        fileType: "",
        fileDescription: null,
        isPrimary: false,
      },
    ];

    expect(hasUploadContent(contents)).toBe(false);
  });
});

describe("hasTagListContent", () => {
  // A typed but uncommitted tag is real content: clicking Save must not
  // read the widget as empty and drop it.
  it("counts a typed but uncommitted tag as content", () => {
    const contents = [{ tags: [], pendingText: "history", isPrimary: false }];

    expect(hasTagListContent(contents)).toBe(true);
  });

  it("does not count whitespace-only pending text as content", () => {
    const contents = [{ tags: [], pendingText: "   ", isPrimary: false }];

    expect(hasTagListContent(contents)).toBe(false);
  });

  it("counts a committed tag as content with no pending text", () => {
    const contents = [
      { tags: ["history"], pendingText: "", isPrimary: false },
    ];

    expect(hasTagListContent(contents)).toBe(true);
  });

  it("is empty with no tags and no pending text", () => {
    const contents = [{ tags: [], pendingText: "", isPrimary: false }];

    expect(hasTagListContent(contents)).toBe(false);
  });
});

describe("hasDateContent", () => {
  // A date with real start/end dates is content even when its label is null,
  // like a required date field that was never given a label.
  it("counts a date with a null label but a valid start date as content", () => {
    const contents = [
      {
        label: null,
        start: { text: "2024-01-01", numeric: "1704067200" },
        end: { text: null, numeric: null },
        isPrimary: false,
      },
    ];

    expect(hasDateContent(contents)).toBe(true);
  });
});
