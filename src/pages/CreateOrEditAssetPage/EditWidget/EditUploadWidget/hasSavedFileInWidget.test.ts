import { describe, it, expect } from "vitest";
import { hasSavedFileInWidget } from "./hasSavedFileInWidget";
import type { Asset } from "@/types";

function makeAsset(widgetFields: Record<string, unknown>): Asset {
  return {
    assetId: "asset_001",
    templateId: 1,
    readyForDisplay: true,
    collectionId: 1,
    availableAfter: null,
    modified: {
      date: "2026-07-24 12:00:00.000000",
      timezone: "UTC",
      timezone_type: 3,
    },
    modifiedBy: 1,
    createdBy: 1,
    deletedBy: null,
    relatedAssetCache: null,
    ...widgetFields,
  } as Asset;
}

describe("hasSavedFileInWidget", () => {
  it("finds a file the widget already holds", () => {
    const asset = makeAsset({
      images: [{ fileId: "file_abc" }, { fileId: "file_def" }],
    });

    expect(hasSavedFileInWidget(asset, "images", "file_def")).toBe(true);
  });

  it("does not find a file the widget does not hold", () => {
    const asset = makeAsset({ images: [{ fileId: "file_abc" }] });

    expect(hasSavedFileInWidget(asset, "images", "file_def")).toBe(false);
  });

  it("does not look outside the named widget", () => {
    const asset = makeAsset({
      images: [{ fileId: "file_abc" }],
      attachments: [{ fileId: "file_def" }],
    });

    expect(hasSavedFileInWidget(asset, "images", "file_def")).toBe(false);
  });

  // a brand new asset has never been saved, so nothing is linked yet
  it("returns false when there is no saved asset", () => {
    expect(hasSavedFileInWidget(null, "images", "file_abc")).toBe(false);
  });

  it("returns false when the widget has no contents on the saved asset", () => {
    const asset = makeAsset({});

    expect(hasSavedFileInWidget(asset, "images", "file_abc")).toBe(false);
  });

  // an upload item exists in the editor before its file finishes uploading
  it("returns false for an empty file id", () => {
    const asset = makeAsset({ images: [{ fileId: "" }] });

    expect(hasSavedFileInWidget(asset, "images", "")).toBe(false);
  });
});
