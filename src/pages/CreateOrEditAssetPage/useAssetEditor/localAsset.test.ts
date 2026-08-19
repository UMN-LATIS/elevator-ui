import { describe, it, expect } from "vitest";
import {
  clearUploadRegenerationFlags,
  diffEditableFields,
  toLocalAsset,
  makeNewLocalAsset,
  migrateAssetToTemplate,
  getAssetDisplayTitle,
} from "./localAsset";
import type {
  Asset,
  PHPDateTime,
  Template,
  WidgetContent,
  WithUuid,
} from "@/types";
import { toSaveableFormData } from "./toSaveableFormData";

const makeCreateUuid = (): (() => string) => {
  let n = 0;
  return () => `created-${++n}`;
};

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
  } as unknown as Template);

const savedDate: PHPDateTime = {
  date: "2026-01-01 00:00:00.000000",
  timezone: "UTC",
  timezone_type: 3,
};

// fields every asset needs that no test in this file cares about
const requiredAssetFields = {
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
  ...requiredAssetFields,
  assetId: "asset-123",
  modified: savedDate,
  ...overrides,
});

describe("makeNewLocalAsset", () => {
  it("builds a new asset with no modified date, since the server has never seen it", () => {
    const asset = makeNewLocalAsset({
      template: emptyTemplate,
      collectionId: 42,
      createUuid: makeCreateUuid(),
    });

    expect(asset.modified).toBeNull();
  });
});

describe("toLocalAsset", () => {
  const oneTextWidget = makeTemplate(1, [{}]);

  const contentIds = (
    asset: Asset,
    fieldTitle: string
  ): (string | undefined)[] =>
    (asset[fieldTitle] as WithUuid<WidgetContent>[]).map(
      (content) => content.uuid
    );

  it("inherits the ids the editor already holds, so a save does not rebuild the form", () => {
    const localAsset = toLocalAsset({
      template: oneTextWidget,
      savedAsset: makeSavedAsset({
        field_1: [{ fieldContents: "saved" }],
      }),
      previousAsset: makeSavedAsset({
        field_1: [{ fieldContents: "saved", uuid: "already-on-screen" }],
      }),
      createUuid: makeCreateUuid(),
    });

    expect(contentIds(localAsset, "field_1")).toEqual(["already-on-screen"]);
  });

  it("creates ids for contents the editor did not have", () => {
    const localAsset = toLocalAsset({
      template: oneTextWidget,
      savedAsset: makeSavedAsset({
        field_1: [{ fieldContents: "first" }, { fieldContents: "second" }],
      }),
      previousAsset: makeSavedAsset({
        field_1: [{ fieldContents: "first", uuid: "already-on-screen" }],
      }),
      createUuid: makeCreateUuid(),
    });

    const [first, second] = contentIds(localAsset, "field_1");
    expect(first).toBe("already-on-screen");
    expect(second).toEqual(expect.any(String));
    expect(second).not.toBe("already-on-screen");
  });

  it("creates ids when loading an asset the editor was not already showing", () => {
    const localAsset = toLocalAsset({
      template: oneTextWidget,
      savedAsset: makeSavedAsset({
        field_1: [{ fieldContents: "loaded" }],
      }),
      createUuid: makeCreateUuid(),
    });

    expect(contentIds(localAsset, "field_1")).toEqual([expect.any(String)]);
  });

  it("keeps a content's id stable when the prior local shape is passed back in as previousAsset", () => {
    // a refetch that changes one item keeps every other item's object
    // reference (TanStack structural sharing), but the mechanism that keeps
    // ids stable across a rebuild is explicit now: the caller passes the
    // prior local shape back in as previousAsset, not a module-level memo
    const savedAsset = makeSavedAsset({
      field_1: [{ fieldContents: "loaded" }],
    });
    const createUuid = makeCreateUuid();

    const firstPass = toLocalAsset({
      template: oneTextWidget,
      savedAsset,
      createUuid,
    });
    const secondPass = toLocalAsset({
      template: oneTextWidget,
      savedAsset,
      previousAsset: firstPass,
      createUuid,
    });

    expect(contentIds(secondPass, "field_1")).toEqual(
      contentIds(firstPass, "field_1")
    );
  });

  it("keeps the blank item's id when the server stored nothing for the field", () => {
    // an inline related asset's editor is keyed on this item's id, so a
    // recreated id across a save's read-back would remount that editor and
    // wipe anything typed into it
    const localAsset = toLocalAsset({
      template: oneTextWidget,
      savedAsset: makeSavedAsset(),
      previousAsset: makeSavedAsset({
        field_1: [{ fieldContents: "", uuid: "blank-on-screen" }],
      }),
      createUuid: makeCreateUuid(),
    });

    expect(contentIds(localAsset, "field_1")).toEqual(["blank-on-screen"]);
  });

  it("keeps the document's own templateId when built with a newer template", () => {
    // while a migration is unsaved, the saved asset must keep saying what
    // the server has, or the migration would read as already saved
    const newerTemplate = makeTemplate(2, [{}]);

    const localAsset = toLocalAsset({
      template: newerTemplate,
      savedAsset: makeSavedAsset({ templateId: 1 }),
      createUuid: makeCreateUuid(),
    });

    expect(localAsset.templateId).toBe(1);
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

    const migrated = migrateAssetToTemplate(
      asset,
      newTemplate,
      makeCreateUuid()
    );

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
      title_1: [{ uuid: "a", fieldContents: "same" }],
    });

    const edits = diffEditableFields({
      draft: savedAsset,
      savedAsset: savedAsset,
      template: template,
    });

    expect(edits).toEqual({});
  });

  it("reports the widget fields the user changed", () => {
    const savedAsset = makeSavedAsset({
      title_1: [{ uuid: "a", fieldContents: "before" }],
    });
    const draft = {
      ...savedAsset,
      title_1: [{ uuid: "a", fieldContents: "after" }],
    };

    const edits = diffEditableFields({
      draft: draft,
      savedAsset: savedAsset,
      template: template,
    });

    expect(edits).toEqual({ title_1: [{ uuid: "a", fieldContents: "after" }] });
  });

  it("ignores widget content ids, which are generated new on every load", () => {
    const savedAsset = makeSavedAsset({
      title_1: [{ uuid: "server-load-1", fieldContents: "same" }],
    });
    const draft = {
      ...savedAsset,
      title_1: [{ uuid: "server-load-2", fieldContents: "same" }],
    };

    expect(
      diffEditableFields({
        draft: draft,
        savedAsset: savedAsset,
        template: template,
      })
    ).toEqual({});
  });

  it("never reports assetId or modified, so a stale draft cannot clear them", () => {
    const savedAsset = makeSavedAsset({ assetId: "asset-123" });
    const staleDraft = { ...savedAsset, assetId: null, modified: null };

    const edits = diffEditableFields({
      draft: staleDraft,
      savedAsset: savedAsset,
      template: template,
    });

    expect(edits.assetId).toBeUndefined();
    expect(edits.modified).toBeUndefined();
  });

  it("reports a template migration, which a save has to send", () => {
    const savedAsset = makeSavedAsset({ templateId: 1 });
    const migrated = { ...savedAsset, templateId: 2 };

    expect(
      diffEditableFields({
        draft: migrated,
        savedAsset: savedAsset,
        template: template,
      })
    ).toEqual({
      templateId: 2,
    });
  });
});

describe("clearUploadRegenerationFlags", () => {
  const uploadTemplate = makeTemplate(1, [
    { fieldTitle: "upload_1", type: "upload" },
  ]);

  it("drops the flag once the save that consumed it has happened", () => {
    const asset = makeSavedAsset({
      upload_1: [{ uuid: "a", fileId: "f1", regenerate: "On" }],
    });

    const cleared = clearUploadRegenerationFlags(asset, uploadTemplate);

    expect(cleared.upload_1).toEqual([{ uuid: "a", fileId: "f1" }]);
  });

  it("leaves non-upload widgets alone", () => {
    const template = makeTemplate(1, [{ fieldTitle: "title_1" }]);
    const asset = makeSavedAsset({
      title_1: [{ uuid: "a", fieldContents: "text" }],
    });

    const cleared = clearUploadRegenerationFlags(asset, template);

    expect(cleared.title_1).toEqual([{ uuid: "a", fieldContents: "text" }]);
  });
});

describe("editable asset properties", () => {
  it("covers every asset property a save sends", () => {
    const template = makeTemplate(1, []);
    const savedAsset = makeSavedAsset();

    // properties toSaveableFormData reads off the asset, minus the ones the
    // server owns and the user cannot edit
    const keysSentByASave = Object.keys(
      toSaveableFormData(savedAsset, template)
    );
    const serverOwnedKeys = ["objectId", "newTemplateId", "newCollectionId"];
    const userEditableKeys = keysSentByASave.filter(
      (key) => !serverOwnedKeys.includes(key)
    );

    // a property here that diffEditableFields does not track would never
    // register as an edit, so it would silently never save
    userEditableKeys.forEach((key) => {
      const changed = { ...savedAsset, [key]: "something-else" };
      const edits = diffEditableFields({
        draft: changed,
        savedAsset,
        template,
      });
      expect(Object.keys(edits)).toContain(key);
    });
  });
});

describe("getAssetDisplayTitle", () => {
  const assetWithTitles = (
    fields: Partial<Record<"title" | "title_1", unknown>>
  ): Asset => ({ assetId: "a1", ...fields } as unknown as Asset);

  it("prefers the title the server derived", () => {
    const asset = assetWithTitles({
      title: ["From the server"],
      title_1: [{ fieldContents: "From the widget" }],
    });

    expect(getAssetDisplayTitle(asset)).toBe("From the server");
  });

  it("falls back to the title widget before the server has one", () => {
    const asset = assetWithTitles({
      title_1: [{ fieldContents: "From the widget" }],
    });

    expect(getAssetDisplayTitle(asset)).toBe("From the widget");
  });

  it("skips an empty server title rather than showing nothing", () => {
    const asset = assetWithTitles({
      title: [""],
      title_1: [{ fieldContents: "From the widget" }],
    });

    expect(getAssetDisplayTitle(asset)).toBe("From the widget");
  });

  it("has no title to show", () => {
    expect(getAssetDisplayTitle(assetWithTitles({}))).toBe("");
  });
});
