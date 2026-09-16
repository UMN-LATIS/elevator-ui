import { describe, it, expect } from "vitest";
import {
  cleanTextAreaHtml,
  isContentKeptByServer,
  storedAvailableAfter,
  storedWidgetContents,
  toStoredShape,
} from "./toStoredShape";
import type { Asset, Template } from "@/types";

/**
 * The keep rules mirror the backend's per-type `hasContents()` checks in
 * application/models/widget_contents/*.php, PHP loose comparison included.
 * Each case here was read from that source.
 */
describe("isContentKeptByServer", () => {
  it("drops a text row whose fieldContents is empty and keeps the string zero", () => {
    expect(isContentKeptByServer({ fieldContents: "" }, "text")).toBe(false);
    expect(isContentKeptByServer({ fieldContents: "0" }, "text")).toBe(true);
  });

  it("keeps every checkbox row, checked or not", () => {
    expect(isContentKeptByServer({ fieldContents: false }, "checkbox")).toBe(
      true
    );
  });

  it("drops a date with only an end, keeps a date with only a start or label", () => {
    const endOnlyDate = {
      label: "",
      start: { text: null, numeric: null },
      end: { text: "2020", numeric: "1577836800" },
    };
    expect(isContentKeptByServer(endOnlyDate, "date")).toBe(false);

    const startOnlyDate = {
      label: null,
      start: { text: "2020", numeric: "1577836800" },
      end: { text: null, numeric: null },
    };
    expect(isContentKeptByServer(startOnlyDate, "date")).toBe(true);
  });

  it("drops a location with only an address, keeps coordinates or a label", () => {
    expect(
      isContentKeptByServer(
        { locationLabel: null, address: "100 Church St SE", loc: undefined },
        "location"
      )
    ).toBe(false);
    expect(
      isContentKeptByServer(
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
    expect(isContentKeptByServer({ tags: [""] }, "tag list")).toBe(false);
    expect(isContentKeptByServer({ tags: ["history"] }, "tag list")).toBe(true);
  });

  it("keeps a tag row whose only tag is still sitting in the input", () => {
    expect(
      isContentKeptByServer({ tags: [], pendingText: "history" }, "tag list")
    ).toBe(true);
  });

  it("drops an upload row with no fileId and a multiselect with no values", () => {
    expect(isContentKeptByServer({ fileId: "", fileType: "" }, "upload")).toBe(
      false
    );
    expect(isContentKeptByServer({ fieldContents: {} }, "multiselect")).toBe(
      false
    );
  });

  it("drops a text area that cleans down to nothing", () => {
    expect(
      isContentKeptByServer({ fieldContents: "<p><br></p>" }, "text area")
    ).toBe(false);
  });
});

describe("storedWidgetContents", () => {
  it("folds tag text still in the input into the saved tags", () => {
    expect(
      storedWidgetContents(
        [{ tags: ["art"], pendingText: " history ", isPrimary: false }],
        "tag list"
      )
    ).toEqual([{ tags: ["art", "history"], isPrimary: false }]);
  });

  it("does not duplicate a pending tag that was already committed", () => {
    expect(
      storedWidgetContents(
        [{ tags: ["history"], pendingText: "history", isPrimary: false }],
        "tag list"
      )
    ).toEqual([{ tags: ["history"], isPrimary: false }]);
  });
});

describe("storedWidgetContents for an upload", () => {
  // both rows verbatim from a local dev round trip: the editor builds the
  // first when an upload completes, the backend answers with the second
  const rowTheEditorBuilt = {
    isPrimary: false,
    uuid: "a3765f11-3992-47bf-9011-85cf9e3ef427",
    fileId: "6a887571274743bee50f0c81",
    fileDescription: "",
    fileType: "image/jpeg",
    searchData: "",
    loc: null,
    sidecars: {},
  };
  const rowTheBackendReturned = {
    loc: null,
    uuid: "a3765f11-3992-47bf-9011-85cf9e3ef427",
    fileId: "6a887571274743bee50f0c81",
    fileType: "jpeg",
    sidecars: [],
    isPrimary: false,
    searchData: null,
    fileDescription: "",
  };

  it("reads a freshly uploaded row and the backend's answer as the same", () => {
    expect(storedWidgetContents([rowTheEditorBuilt], "upload")).toEqual(
      storedWidgetContents([rowTheBackendReturned], "upload")
    );
  });

  it("still sees a description the user typed", () => {
    expect(storedWidgetContents([rowTheEditorBuilt], "upload")).not.toEqual(
      storedWidgetContents(
        [{ ...rowTheBackendReturned, fileDescription: "a caption" }],
        "upload"
      )
    );
  });

  it("still sees a sidecar the user set", () => {
    expect(storedWidgetContents([rowTheEditorBuilt], "upload")).not.toEqual(
      storedWidgetContents(
        [{ ...rowTheBackendReturned, sidecars: { ppm: 300 } }],
        "upload"
      )
    );
  });
});

describe("cleanTextAreaHtml", () => {
  it("removes empty paragraphs and turns non-breaking spaces into plain spaces", () => {
    expect(cleanTextAreaHtml("<p>Hello&nbsp;there</p><p><br></p>")).toBe(
      "<p>Hello there</p>"
    );
  });
});

describe("storedAvailableAfter", () => {
  it("compares at day precision, whichever side wrote the value", () => {
    expect(
      storedAvailableAfter({
        date: "2026-03-01 00:00:00.000000",
        timezone_type: 3,
        timezone: "UTC",
      })
    ).toBe("2026-03-01");
    expect(
      storedAvailableAfter({
        date: "2026-03-01",
        timezone_type: 3,
        timezone: "UTC",
      })
    ).toBe("2026-03-01");
    expect(storedAvailableAfter(null)).toBeNull();
  });
});

describe("toStoredShape", () => {
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

    expect(toStoredShape(draft, template)).toEqual(
      toStoredShape(stored, template)
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

    expect(toStoredShape(asset, template)).not.toHaveProperty("orphan_1");
  });
});
