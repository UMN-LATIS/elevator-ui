import { describe, it, expect } from "vitest";
import {
  applyAssetEdit,
  applySaveResult,
  makeLocalAsset,
  migrateAssetToTemplate,
} from "./utils";
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

const makeUnsavedAsset = (overrides: Partial<UnsavedAsset> = {}): UnsavedAsset => ({
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

describe("applyAssetEdit", () => {
  it("takes the assetId from an edit that carries one", () => {
    const merged = applyAssetEdit(
      makeSavedAsset({ assetId: "current-id" }),
      makeSavedAsset({ assetId: "edit-id" })
    );

    expect(merged.assetId).toBe("edit-id");
  });

  it("keeps the saved assetId when the edit has none", () => {
    const merged = applyAssetEdit(
      makeSavedAsset({ assetId: "asset-123" }),
      makeUnsavedAsset({ title: ["edited while the first save was in flight"] })
    );

    // losing the assetId sends an empty objectId, which the server reads as
    // a create, so the edit would silently become a second asset
    expect(merged.assetId).toBe("asset-123");
  });

  it("keeps the saved modified date when the edit has none", () => {
    const merged = applyAssetEdit(
      makeSavedAsset({ modified: savedDate }),
      makeUnsavedAsset()
    );

    expect(merged.modified).toEqual(savedDate);
  });

  it("carries the edit's content through", () => {
    const merged = applyAssetEdit(
      makeSavedAsset(),
      makeUnsavedAsset({ title_1: [{ fieldContents: "new title" }] })
    );

    expect(merged.title_1).toEqual([{ fieldContents: "new title" }]);
  });

  it("treats an empty-string assetId on the edit as new, not as an id", () => {
    // the server reads an empty objectId as a create, so "" has to lose to a
    // real saved id the same way null does
    const merged = applyAssetEdit(
      makeSavedAsset({ assetId: "asset-123" }),
      makeSavedAsset({ assetId: "" })
    );

    expect(merged.assetId).toBe("asset-123");
  });

  it("drops an empty-string assetId on the current asset rather than keeping it", () => {
    const merged = applyAssetEdit(
      makeSavedAsset({ assetId: "" }),
      makeUnsavedAsset()
    );

    expect(merged.assetId).toBeNull();
  });

  it("leaves the assetId null when neither asset has been saved", () => {
    const merged = applyAssetEdit(makeUnsavedAsset(), makeUnsavedAsset());

    expect(merged.assetId).toBeNull();
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

  it("turns an unsaved asset into a saved one", () => {
    const merged = applySaveResult(makeUnsavedAsset(), makeSavedAsset());

    // the return type is Asset, so these two only re-assert at runtime what
    // the compiler already checked
    expect(merged.assetId).toBe("asset-123");
    expect(merged.modified).toEqual(savedDate);
  });
});
