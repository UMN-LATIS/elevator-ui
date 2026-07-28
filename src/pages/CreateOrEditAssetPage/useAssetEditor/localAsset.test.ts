import { describe, it, expect } from "vitest";
import {
  applySaveResult,
  makeLocalAsset,
  migrateAssetToTemplate,
} from "./localAsset";
import type { Asset, PHPDateTime, Template, UnsavedAsset } from "@/types";

const emptyTemplate = {
  templateId: 1,
  widgetArray: [],
} as unknown as Template;

const savedDate: PHPDateTime = {
  date: "2026-01-01 00:00:00.000000",
  timezone: "UTC",
  timezone_type: 3,
};

// fields every asset needs that no test in this file cares about
const assetScaffolding = {
  templateId: 1,
  readyForDisplay: true,
  collectionId: 1,
  availableAfter: null,
  modifiedBy: 1,
  createdBy: 1,
  deletedBy: null,
  relatedAssetCache: null,
};

const makeSavedAsset = (overrides: Partial<Asset> = {}): Asset => ({
  ...assetScaffolding,
  assetId: "asset-123",
  modified: savedDate,
  ...overrides,
});

const makeUnsavedAsset = (
  overrides: Partial<UnsavedAsset> = {}
): UnsavedAsset => ({
  ...assetScaffolding,
  assetId: null,
  modified: null,
  ...overrides,
});

describe("makeLocalAsset", () => {
  it("returns null modified date for a new unsaved asset", () => {
    const asset = makeLocalAsset({
      template: emptyTemplate,
      collectionId: 42,
      savedAsset: null,
    });

    expect(asset.modified).toBeNull();
  });
});

describe("migrateAssetToTemplate", () => {
  it("keeps the asset's fields and takes the new template's id", () => {
    const newTemplate = {
      templateId: 2,
      widgetArray: [],
    } as unknown as Template;
    const asset = makeSavedAsset({
      templateId: 1,
      title_1: [{ fieldContents: "survives the migration" }],
    });

    const migrated = migrateAssetToTemplate(asset, newTemplate);

    expect(migrated.templateId).toBe(2);
    expect(migrated.assetId).toBe("asset-123");
    expect(migrated.title_1).toEqual([
      { fieldContents: "survives the migration" },
    ]);
  });
});

describe("applySaveResult", () => {
  it("takes the server-owned fields from the save response", () => {
    const saveResponse = makeSavedAsset({
      assetId: "asset-123",
      title: ["Saved Title"],
      modified: savedDate,
      modifiedBy: 7,
      firstFileHandlerId: "file-handler-1",
    });

    const merged = applySaveResult(makeUnsavedAsset(), saveResponse);

    expect(merged.assetId).toBe("asset-123");
    expect(merged.title).toEqual(["Saved Title"]);
    expect(merged.modified).toEqual(savedDate);
    expect(merged.modifiedBy).toBe(7);
    expect(merged.firstFileHandlerId).toBe("file-handler-1");
  });

  it("keeps widget contents edited while the save was in flight", () => {
    const localAsset = makeUnsavedAsset({
      title_1: [{ fieldContents: "typed during the save" }],
    });
    const saveResponse = makeSavedAsset({
      title_1: [{ fieldContents: "what the server saw at save time" }],
    });

    const merged = applySaveResult(localAsset, saveResponse);

    expect(merged.title_1).toEqual([
      { fieldContents: "typed during the save" },
    ]);
  });
});
