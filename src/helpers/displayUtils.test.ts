import { describe, it, expect } from "vitest";
import { getWidgetContents } from "./displayUtils";
import type { Asset, UploadWidgetDef, UploadWidgetContent } from "@/types";

// Minimal asset/widget shape for testing getWidgetContents
function makeAsset(uploadEntries: unknown[]): Partial<Asset> {
  return { upload_1: uploadEntries } as Partial<Asset>;
}

const uploadWidget: UploadWidgetDef = {
  widgetId: 1,
  type: "upload",
  fieldTitle: "upload_1",
  label: "Photo",
  tooltip: "",
  fieldData: {},
  allowMultiple: true,
  attemptAutocomplete: false,
  display: true,
  displayInPreview: false,
  required: false,
  searchable: false,
  directSearch: false,
  clickToSearch: false,
  clickToSearchType: 0,
  viewOrder: 0,
  templateOrder: 0,
};

const realEntry: UploadWidgetContent = {
  fileId: "abc123",
  fileDescription: "photo.jpg",
  fileType: "jpg",
  searchData: null,
  loc: null,
  sidecars: {},
  isPrimary: true,
};

describe("getWidgetContents", () => {
  it("returns null when the asset has no data for the widget field", () => {
    const result = getWidgetContents({
      asset: {} as Asset,
      widget: uploadWidget,
    });
    expect(result).toBeNull();
  });

  it("returns real entries unchanged", () => {
    const asset = makeAsset([realEntry]) as Asset;
    const result = getWidgetContents({ asset, widget: uploadWidget });
    expect(result).toHaveLength(1);
    expect(result?.[0]).toMatchObject({ fileId: "abc123" });
  });

  it("sorts primary entries first", () => {
    const nonPrimary = { ...realEntry, isPrimary: false, fileId: "secondary" };
    const primary = { ...realEntry, isPrimary: true, fileId: "primary" };
    const asset = makeAsset([nonPrimary, primary]) as Asset;
    const result = getWidgetContents({ asset, widget: uploadWidget });
    expect(result?.[0].fileId).toBe("primary");
    expect(result?.[1].fileId).toBe("secondary");
  });

  it("filters out empty {} entries produced by deleted file handlers", () => {
    // The PHP backend returns empty objects when a file handler is deleted
    // but the widget JSON hasn't been cleaned up:
    //   "upload_1": [{real entry}, {}, {}, {}]
    // These must not reach UploadWidget where fileId would be undefined,
    // producing broken thumbnail requests to /tinyImageByFileId/undefined/.
    const asset = makeAsset([realEntry, {}, {}, {}]) as Asset;
    const result = getWidgetContents({ asset, widget: uploadWidget });
    expect(result).toHaveLength(1);
    expect(result?.[0]).toMatchObject({ fileId: "abc123" });
  });

  it("returns empty array (not null) when all entries are empty objects", () => {
    const asset = makeAsset([{}, {}]) as Asset;
    const result = getWidgetContents({ asset, widget: uploadWidget });
    expect(result).toEqual([]);
  });

  it("filters out empty [] entries produced by deleted file handlers", () => {
    // The backend can also serialise missing upload slots as empty arrays `[]`
    // rather than empty objects `{}` — both should be treated the same.
    const asset = makeAsset([realEntry, [], [], []]) as Asset;
    const result = getWidgetContents({ asset, widget: uploadWidget });
    expect(result).toHaveLength(1);
    expect(result?.[0]).toMatchObject({ fileId: "abc123" });
  });
});
