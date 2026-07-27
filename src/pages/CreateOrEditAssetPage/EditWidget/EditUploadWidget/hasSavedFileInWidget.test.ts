import { describe, it, expect } from "vitest";
import { hasSavedFileInWidget } from "./hasSavedFileInWidget";
import type { Asset } from "@/types";

function makeUploadContent(fileId: string) {
  return { fileId, fileDescription: null, fileType: "image/jpeg" };
}

function makeAsset(widgetFields: Record<string, unknown>): Asset {
  return widgetFields as unknown as Asset;
}

describe("hasSavedFileInWidget", () => {
  it("finds a file the widget already holds", () => {
    const asset = makeAsset({
      images: [makeUploadContent("file_abc"), makeUploadContent("file_def")],
    });

    expect(hasSavedFileInWidget(asset, "images", "file_def")).toBe(true);
  });

  it("does not find a file the widget does not hold", () => {
    const asset = makeAsset({ images: [makeUploadContent("file_abc")] });

    expect(hasSavedFileInWidget(asset, "images", "file_def")).toBe(false);
  });

  it("does not look outside the named widget", () => {
    const asset = makeAsset({
      images: [makeUploadContent("file_abc")],
      attachments: [makeUploadContent("file_def")],
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

  // a matching fileId is not enough, the entry has to be a real upload content
  it("ignores contents that are not upload widget contents", () => {
    const asset = makeAsset({ images: [{ fileId: "file_abc" }] });

    expect(hasSavedFileInWidget(asset, "images", "file_abc")).toBe(false);
  });

  it("returns false for an empty file id", () => {
    const asset = makeAsset({ images: [makeUploadContent("")] });

    expect(hasSavedFileInWidget(asset, "images", "")).toBe(false);
  });
});
