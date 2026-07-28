import { describe, it, expect } from "vitest";
import {
  clearUploadRegenerationFlags,
  diffEditableFields,
  makeNewLocalAsset,
  migrateAssetToTemplate,
  editsWithFieldEdit,
} from "./localAsset";
import type { Asset, PHPDateTime, Template } from "@/types";
import { toSaveableFormData } from "./toSaveableFormData";

const emptyTemplate = {
  templateId: 1,
  widgetArray: [],
} as unknown as Template;

const makeTemplate = (
  templateId: number,
  widgetArray: Record<string, unknown>[]
): Template =>
  ({
    templateId,
    widgetArray: widgetArray.map((widget, index) => ({
      widgetId: index + 1,
      type: "text",
      fieldTitle: `field_${index + 1}`,
      ...widget,
    })),
  }) as unknown as Template;

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

describe("makeNewLocalAsset", () => {
  it("returns null modified date for a new unsaved asset", () => {
    const asset = makeNewLocalAsset({
      template: emptyTemplate,
      collectionId: 42,
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

describe("diffEditableFields", () => {
  const template = makeTemplate(1, [{ fieldTitle: "title_1" }]);

  it("reports nothing when the draft matches the saved asset", () => {
    const savedAsset = makeSavedAsset({
      title_1: [{ id: "a", fieldContents: "same" }],
    });

    const edits = diffEditableFields({ draft: savedAsset, savedAsset: savedAsset, template: template });

    expect(edits).toEqual({});
  });

  it("reports the widget fields the user changed", () => {
    const savedAsset = makeSavedAsset({
      title_1: [{ id: "a", fieldContents: "before" }],
    });
    const draft = { ...savedAsset, title_1: [{ id: "a", fieldContents: "after" }] };

    const edits = diffEditableFields({ draft: draft, savedAsset: savedAsset, template: template });

    expect(edits).toEqual({ title_1: [{ id: "a", fieldContents: "after" }] });
  });

  it("ignores widget content ids, which are generated fresh on every load", () => {
    const savedAsset = makeSavedAsset({
      title_1: [{ id: "server-load-1", fieldContents: "same" }],
    });
    const draft = {
      ...savedAsset,
      title_1: [{ id: "server-load-2", fieldContents: "same" }],
    };

    expect(diffEditableFields({ draft: draft, savedAsset: savedAsset, template: template })).toEqual({});
  });

  it("never reports identity fields, so a stale draft cannot clear the assetId", () => {
    const savedAsset = makeSavedAsset({ assetId: "asset-123" });
    const staleDraft = { ...savedAsset, assetId: null, modified: null };

    const edits = diffEditableFields({ draft: staleDraft, savedAsset: savedAsset, template: template });

    expect(edits.assetId).toBeUndefined();
    expect(edits.modified).toBeUndefined();
  });

  it("reports a template migration, which a save has to send", () => {
    const savedAsset = makeSavedAsset({ templateId: 1 });
    const migrated = { ...savedAsset, templateId: 2 };

    expect(diffEditableFields({ draft: migrated, savedAsset: savedAsset, template: template })).toEqual({
      templateId: 2,
    });
  });
});

describe("editsWithFieldEdit", () => {
  const savedAsset = makeSavedAsset({
    title_1: [{ id: "a", fieldContents: "saved" }],
  });

  it("records a changed field", () => {
    const edits = editsWithFieldEdit({
      edits: {},
      savedAsset,
      assetKey: "title_1",
      value: [{ id: "a", fieldContents: "typed" }],
    });

    expect(edits.title_1).toEqual([{ id: "a", fieldContents: "typed" }]);
  });

  it("drops the field when it is set back to its saved value", () => {
    const edited = editsWithFieldEdit({
      edits: {},
      savedAsset,
      assetKey: "title_1",
      value: [{ id: "a", fieldContents: "typed" }],
    });

    const undone = editsWithFieldEdit({
      edits: edited,
      savedAsset,
      assetKey: "title_1",
      value: [{ id: "a", fieldContents: "saved" }],
    });

    expect(undone).toEqual({});
  });

  it("leaves other pending edits alone", () => {
    const edits = editsWithFieldEdit({
      edits: { collectionId: 9 },
      savedAsset,
      assetKey: "title_1",
      value: [{ id: "a", fieldContents: "typed" }],
    });

    expect(edits.collectionId).toBe(9);
  });
});

describe("clearUploadRegenerationFlags", () => {
  const uploadTemplate = makeTemplate(1, [
    { fieldTitle: "upload_1", type: "upload" },
  ]);

  it("drops the flag once the save that consumed it has happened", () => {
    const asset = makeSavedAsset({
      upload_1: [{ id: "a", fileId: "f1", regenerate: "On" }],
    });

    const cleared = clearUploadRegenerationFlags(asset, uploadTemplate);

    expect(cleared.upload_1).toEqual([{ id: "a", fileId: "f1" }]);
  });

  it("leaves non-upload widgets alone", () => {
    const template = makeTemplate(1, [{ fieldTitle: "title_1" }]);
    const asset = makeSavedAsset({
      title_1: [{ id: "a", fieldContents: "text" }],
    });

    const cleared = clearUploadRegenerationFlags(asset, template);

    expect(cleared.title_1).toEqual([{ id: "a", fieldContents: "text" }]);
  });
});

describe("editable asset properties", () => {
  it("covers every asset property a save sends", () => {
    const template = makeTemplate(1, []);
    const savedAsset = makeSavedAsset();

    // properties toSaveableFormData reads off the asset, minus the ones the
    // server owns and the user cannot edit
    const sentByASave = Object.keys(toSaveableFormData(savedAsset, template));
    const serverOwned = ["objectId", "newTemplateId", "newCollectionId"];
    const editableBySomeone = sentByASave.filter(
      (key) => !serverOwned.includes(key)
    );

    // a property here that diffEditableFields does not track would never
    // register as an edit, so it would silently never save
    editableBySomeone.forEach((key) => {
      const changed = { ...savedAsset, [key]: "something-else" };
      const edits = diffEditableFields({ draft: changed, savedAsset, template });
      expect(Object.keys(edits)).toContain(key);
    });
  });
});
