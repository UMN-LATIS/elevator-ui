import { describe, it, expect } from "vitest";
import { toSaveableFormData } from "./toSaveableFormData";
import type { Asset, Template, UploadWidgetDef, UploadWidgetContent } from "@/types";

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

const template: Template = {
  widgetArray: [uploadWidget],
} as unknown as Template;

const realEntry: UploadWidgetContent = {
  fileId: "abc123",
  fileDescription: "photo.jpg",
  fileType: "jpg",
  searchData: null,
  loc: null,
  sidecars: {},
  isPrimary: true,
};

function makeAsset(uploadEntries: unknown[]): Asset {
  return {
    assetId: "asset-1",
    templateId: 1,
    collectionId: 1,
    upload_1: uploadEntries,
  } as unknown as Asset;
}

describe("toSaveableFormData — prepWidgetsForSave sanitisation", () => {
  it("preserves real upload entries", () => {
    const asset = makeAsset([realEntry]);
    const result = toSaveableFormData(asset, template);
    expect(result.upload_1).toHaveLength(1);
    expect((result.upload_1 as unknown as UploadWidgetContent[])[0].fileId).toBe("abc123");
  });

  it("strips empty {} entries before save", () => {
    // If corrupted data exists in local state, it should not be round-tripped
    // back to the backend on the next save.
    const asset = makeAsset([realEntry, {}, {}]);
    const result = toSaveableFormData(asset, template);
    expect(result.upload_1).toHaveLength(1);
  });

  it("strips empty [] entries before save", () => {
    // The backend stores widget entries as JSON arrays. An empty upload slot
    // can be serialised as `[]` rather than `{}` — both should be stripped.
    const asset = makeAsset([realEntry, [], [], []]);
    const result = toSaveableFormData(asset, template);
    expect(result.upload_1).toHaveLength(1);
  });

  it("strips null entries before save", () => {
    const asset = makeAsset([realEntry, null]);
    const result = toSaveableFormData(asset, template);
    expect(result.upload_1).toHaveLength(1);
  });

  it("returns empty array (not omitted) when all entries are empty", () => {
    const asset = makeAsset([{}, {}]);
    const result = toSaveableFormData(asset, template);
    expect(result.upload_1).toEqual([]);
  });

  it("omits the field entirely when the widget value is not an array", () => {
    // The backend could theoretically return a non-array for a widget field.
    // We skip the field rather than crashing.
    const asset = { ...makeAsset([]), upload_1: "unexpected" } as unknown as Asset;
    const result = toSaveableFormData(asset, template);
    expect(result).not.toHaveProperty("upload_1");
  });
});
