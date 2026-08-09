import { describe, it, expect } from "vitest";
import {
  cleanTextAreaHtml,
  doesServerKeepContent,
  normalizeAssetForSave,
  normalizeAvailableAfter,
  normalizeWidgetContents,
} from "./normalizeAssetForSave";
import type { Asset, Template } from "@/types";

/**
 * The keep rules mirror the backend's per-type `hasContents()` checks in
 * application/models/widget_contents/*.php, PHP loose comparison included.
 * Each case here was read from that source.
 */
describe("doesServerKeepContent", () => {
  it("drops a text row whose fieldContents is empty and keeps the string zero", () => {
    expect(doesServerKeepContent({ fieldContents: "" }, "text")).toBe(false);
    expect(doesServerKeepContent({ fieldContents: "0" }, "text")).toBe(true);
  });

  it("keeps every checkbox row, checked or not", () => {
    expect(doesServerKeepContent({ fieldContents: false }, "checkbox")).toBe(
      true
    );
  });

  it("drops a date with only an end, keeps a date with only a start or label", () => {
    const endOnlyDate = {
      label: "",
      start: { text: null, numeric: null },
      end: { text: "2020", numeric: "1577836800" },
    };
    expect(doesServerKeepContent(endOnlyDate, "date")).toBe(false);

    const startOnlyDate = {
      label: null,
      start: { text: "2020", numeric: "1577836800" },
      end: { text: null, numeric: null },
    };
    expect(doesServerKeepContent(startOnlyDate, "date")).toBe(true);
  });

  it("drops a location with only an address, keeps coordinates or a label", () => {
    expect(
      doesServerKeepContent(
        { locationLabel: null, address: "100 Church St SE", loc: undefined },
        "location"
      )
    ).toBe(false);
    expect(
      doesServerKeepContent(
        {
          locationLabel: null,
          address: null,
          loc: { type: "Point", coordinates: [-93.23, 44.97] },
        },
        "location"
      )
    ).toBe(true);
  });

  it("drops a tag row holding only empty strings", () => {
    expect(doesServerKeepContent({ tags: [""] }, "tag list")).toBe(false);
    expect(doesServerKeepContent({ tags: ["history"] }, "tag list")).toBe(true);
  });

  it("keeps a tag row whose only tag is still sitting in the input", () => {
    expect(
      doesServerKeepContent({ tags: [], pendingText: "history" }, "tag list")
    ).toBe(true);
  });

  it("drops an upload row with no fileId and a multiselect with no values", () => {
    expect(doesServerKeepContent({ fileId: "", fileType: "" }, "upload")).toBe(
      false
    );
    expect(doesServerKeepContent({ fieldContents: {} }, "multiselect")).toBe(
      false
    );
  });

  it("drops a text area that cleans down to nothing", () => {
    expect(
      doesServerKeepContent({ fieldContents: "<p><br></p>" }, "text area")
    ).toBe(false);
  });
});

describe("normalizeWidgetContents", () => {
  it("folds tag text still in the input into the saved tags", () => {
    expect(
      normalizeWidgetContents(
        [{ tags: ["art"], pendingText: " history ", isPrimary: false }],
        "tag list"
      )
    ).toEqual([{ tags: ["art", "history"], isPrimary: false }]);
  });

  it("does not duplicate a pending tag that was already committed", () => {
    expect(
      normalizeWidgetContents(
        [{ tags: ["history"], pendingText: "history", isPrimary: false }],
        "tag list"
      )
    ).toEqual([{ tags: ["history"], isPrimary: false }]);
  });
});

describe("cleanTextAreaHtml", () => {
  it("removes empty paragraphs and normalizes non-breaking spaces", () => {
    expect(cleanTextAreaHtml("<p>Hello&nbsp;there</p><p><br></p>")).toBe(
      "<p>Hello there</p>"
    );
  });
});

describe("normalizeAvailableAfter", () => {
  it("compares at day precision, whichever side wrote the value", () => {
    expect(
      normalizeAvailableAfter({
        date: "2026-03-01 00:00:00.000000",
        timezone_type: 3,
        timezone: "UTC",
      })
    ).toBe("2026-03-01");
    expect(
      normalizeAvailableAfter({
        date: "2026-03-01",
        timezone_type: 3,
        timezone: "UTC",
      })
    ).toBe("2026-03-01");
    expect(normalizeAvailableAfter(null)).toBeNull();
  });
});

describe("normalizeAssetForSave", () => {
  const template = {
    templateId: 1,
    widgetArray: [{ widgetId: 1, type: "text", fieldTitle: "field_1" }],
  } as unknown as Template;

  it("strips content ids and blank rows, so two assets that store the same compare equal", () => {
    const draft = {
      templateId: 1,
      collectionId: 1,
      readyForDisplay: true,
      availableAfter: null,
      field_1: [
        { fieldContents: "typed", isPrimary: false, uuid: "row-1" },
        { fieldContents: "", isPrimary: false, uuid: "row-2" },
      ],
    } as unknown as Asset;
    const stored = {
      templateId: 1,
      collectionId: 1,
      readyForDisplay: true,
      availableAfter: null,
      field_1: [{ fieldContents: "typed", isPrimary: false }],
    } as unknown as Asset;

    expect(normalizeAssetForSave(draft, template)).toEqual(
      normalizeAssetForSave(stored, template)
    );
  });

  it("excludes fields the template does not define, which a save never sends", () => {
    const asset = {
      templateId: 1,
      collectionId: 1,
      readyForDisplay: true,
      availableAfter: null,
      orphan_1: [{ fieldContents: "left over from an old template" }],
    } as unknown as Asset;

    expect(normalizeAssetForSave(asset, template)).not.toHaveProperty(
      "orphan_1"
    );
  });
});
