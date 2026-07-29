import { describe, it, expect } from "vitest";
import {
  editorReducer,
  initialEditorModel,
  selectLocalAsset,
  type EditorModel,
} from "./editorReducer";
import type {
  Asset,
  PHPDateTime,
  Template,
  UnsavedAsset,
  WidgetDef,
} from "@/types";

const makeTemplate = (
  templateId: number,
  widgetArray: Partial<WidgetDef>[] = []
): Template =>
  ({
    templateId,
    widgetArray: widgetArray.map((widget, index) => ({
      widgetId: index + 1,
      type: "text",
      fieldTitle: `field_${index + 1}`,
      label: `Field ${index + 1}`,
      ...widget,
    })),
  }) as unknown as Template;

const emptyTemplate = makeTemplate(1);
const otherTemplate = makeTemplate(2);

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

const FENCING_TOKEN = 5;

const idle: EditorModel = {
  status: "idle",
  fencingToken: FENCING_TOKEN,
};

const loadingTemplate: EditorModel = {
  status: "loadingTemplate",
  fencingToken: FENCING_TOKEN,
  collectionId: 42,
};

const editingNewAsset = (
  localAsset: UnsavedAsset = makeUnsavedAsset(),
  template: Template = emptyTemplate
): EditorModel => ({
  status: "editingNewAsset",
  fencingToken: FENCING_TOKEN,
  localAsset,
  template,
});

const editingExistingAsset = (
  savedAsset: Asset = makeSavedAsset(),
  edits: Partial<Asset> = {},
  template: Template = emptyTemplate
): EditorModel => ({
  status: "editingExistingAsset",
  fencingToken: FENCING_TOKEN,
  savedAsset,
  edits,
  template,
});

/** throws rather than returning null, so tests read without a guard */
const localAssetOf = (model: EditorModel): Asset | UnsavedAsset => {
  const asset = selectLocalAsset(model);
  if (!asset) throw new Error("expected an asset");
  return asset;
};

describe("editorReducer", () => {
  describe("starting a new asset", () => {
    it("moves to loadingTemplate and issues a new fencingToken", () => {
      const next = editorReducer(idle, {
        type: "newAssetRequested",
        collectionId: 42,
      });

      // the new token lets results still in flight be dropped on arrival
      expect(next).toEqual({
        status: "loadingTemplate",
        fencingToken: FENCING_TOKEN + 1,
        collectionId: 42,
      });
    });

    it("builds a fresh unsaved asset when the requested template loads", () => {
      const next = editorReducer(loadingTemplate, {
        type: "templateLoaded",
        fencingToken: FENCING_TOKEN,
        template: emptyTemplate,
      });

      expect(next.status).toBe("editingNewAsset");
      if (next.status !== "editingNewAsset") return;
      expect(localAssetOf(next).assetId).toBeNull();
      expect(localAssetOf(next).modified).toBeNull();
      expect(localAssetOf(next).collectionId).toBe(42);
    });

    it("scaffolds a field for every widget in the template", () => {
      const template = makeTemplate(1, [
        { fieldTitle: "title_1" },
        { fieldTitle: "notes_1" },
      ]);

      const next = editorReducer(loadingTemplate, {
        type: "templateLoaded",
        fencingToken: FENCING_TOKEN,
        template,
      });

      if (next.status !== "editingNewAsset") throw new Error("expected editingNewAsset");
      expect(localAssetOf(next).title_1).toHaveLength(1);
      expect(localAssetOf(next).notes_1).toHaveLength(1);
      const [titleContent] = localAssetOf(next).title_1 as { id: string }[];
      expect(titleContent.id).toEqual(expect.any(String));
    });

    it("keeps the error when the template fails to load", () => {
      const next = editorReducer(loadingTemplate, {
        type: "templateLoadFailed",
        fencingToken: FENCING_TOKEN,
        error: new Error("network down"),
      });

      expect(next.status).toBe("loadFailed");
      if (next.status !== "loadFailed") return;
      expect(next.error.message).toBe("network down");
      expect(next.fencingToken).toBe(FENCING_TOKEN + 1);
    });

    it("drops a load failure from an abandoned request", () => {
      const next = editorReducer(loadingTemplate, {
        type: "templateLoadFailed",
        fencingToken: FENCING_TOKEN - 1,
        error: new Error("too late"),
      });

      expect(next).toBe(loadingTemplate);
    });
  });

  describe("dropping results that carry an old fencingToken", () => {
    it("drops a template that arrives for a superseded request", () => {
      // the user picked another template, so this model holds a newer token
      const superseded: EditorModel = {
        ...loadingTemplate,
        fencingToken: FENCING_TOKEN + 1,
      };

      const next = editorReducer(superseded, {
        type: "templateLoaded",
        fencingToken: FENCING_TOKEN,
        template: otherTemplate,
      });

      expect(next).toBe(superseded);
    });

    it("keeps the newest template request rather than the first to resolve", () => {
      // the user picked again before the first template arrived, so pick
      // order must win, not network order
      const afterSecondRequest = editorReducer(loadingTemplate, {
        type: "newAssetRequested",
        collectionId: 42,
      });

      const slowFirst = editorReducer(afterSecondRequest, {
        type: "templateLoaded",
        fencingToken: FENCING_TOKEN,
        template: emptyTemplate,
      });
      expect(slowFirst).toBe(afterSecondRequest);

      const second = editorReducer(afterSecondRequest, {
        type: "templateLoaded",
        fencingToken: afterSecondRequest.fencingToken,
        template: otherTemplate,
      });
      if (second.status !== "editingNewAsset") throw new Error("expected editingNewAsset");
      expect(second.template.templateId).toBe(2);
    });

    it("drops a save that resolves after the user opened a different asset", () => {
      // the save was started before the user opened another asset
      const otherSession = editingExistingAsset(makeSavedAsset({ assetId: "asset-B" }));

      const next = editorReducer(otherSession, {
        type: "saveSucceeded",
        fencingToken: FENCING_TOKEN - 1,
        didCreateAsset: false,
        savedAsset: makeSavedAsset({ assetId: "asset-A" }),
      });

      // accepting it would stamp asset A's id onto asset B's content, and
      // the next save would then overwrite asset A on the server
      expect(next).toBe(otherSession);
    });

    it("drops a late create response once the user is editing an existing asset", () => {
      const otherSession = editingExistingAsset(
        makeSavedAsset({ assetId: "asset-B" })
      );

      const next = editorReducer(otherSession, {
        type: "saveSucceeded",
        fencingToken: FENCING_TOKEN - 1,
        didCreateAsset: true,
        savedAsset: makeSavedAsset({ assetId: "asset-A" }),
      });

      expect(next).toBe(otherSession);
    });

    it("drops an update response that resolves after the user started a new asset, so the new draft cannot silently overwrite the old asset", () => {
      // the user is editing asset X and a save of it is in flight
      const editingX = editingExistingAsset(
        makeSavedAsset({ assetId: "asset-X" })
      );
      const saveGeneration = editingX.fencingToken;

      // before the save resolves, the user starts a new asset and its
      // template (cached, so near-instant) loads
      const loading = editorReducer(editingX, {
        type: "newAssetRequested",
        collectionId: 42,
      });
      const freshDraft = editorReducer(loading, {
        type: "templateLoaded",
        fencingToken: loading.fencingToken,
        template: emptyTemplate,
      });

      // asset X's update response finally lands
      const next = editorReducer(freshDraft, {
        type: "saveSucceeded",
        fencingToken: saveGeneration,
        didCreateAsset: false,
        savedAsset: makeSavedAsset({ assetId: "asset-X" }),
      });

      // accepting it would adopt asset X as the baseline under the fresh
      // draft, so the next save would overwrite asset X with that draft
      expect(next).toBe(freshDraft);
    });

    it("drops an asset that arrives for a superseded request", () => {
      const next = editorReducer(editingExistingAsset(), {
        type: "assetLoaded",
        fencingToken: FENCING_TOKEN - 1,
        savedAsset: makeSavedAsset({ assetId: "stale" }),
        template: otherTemplate,
      });

      expect(next.status).toBe("editingExistingAsset");
      if (next.status !== "editingExistingAsset") return;
      expect(localAssetOf(next).assetId).toBe("asset-123");
    });

    it("drops a migration that arrives for a superseded request", () => {
      const current = editingExistingAsset();

      const next = editorReducer(current, {
        type: "templateMigrated",
        fencingToken: FENCING_TOKEN - 1,
        template: otherTemplate,
      });

      expect(next).toBe(current);
    });
  });

  describe("loading an existing asset", () => {
    it("issues a new fencingToken while the request is in flight", () => {
      const next = editorReducer(editingExistingAsset(), { type: "existingAssetRequested" });

      // the current asset stays editable, but operations started under the
      // old fencingToken can no longer land
      expect(next.status).toBe("editingExistingAsset");
      expect(next.fencingToken).toBe(FENCING_TOKEN + 1);
    });

    it("moves to editingExistingAsset for the loaded asset", () => {
      const savedAsset = makeSavedAsset({ collectionId: 7 });

      const next = editorReducer(idle, {
        type: "assetLoaded",
        fencingToken: FENCING_TOKEN,
        savedAsset,
        template: emptyTemplate,
      });

      expect(next.status).toBe("editingExistingAsset");
      if (next.status !== "editingExistingAsset") return;
      expect(localAssetOf(next).assetId).toBe("asset-123");
      expect(localAssetOf(next).collectionId).toBe(7);
      expect(next.savedAsset).toEqual(savedAsset);
    });

    it("leaves the saved baseline untouched when a field is edited", () => {
      const template = makeTemplate(1, [{ fieldTitle: "title_1" }]);
      const loaded = editorReducer(idle, {
        type: "assetLoaded",
        fencingToken: FENCING_TOKEN,
        savedAsset: makeSavedAsset({
          title_1: [{ id: "a", fieldContents: "original" }],
        }),
        template,
      });

      const edited = editorReducer(loaded, {
        type: "widgetContentsEdited",
        fieldTitle: "title_1",
        contents: [{ id: "a", fieldContents: "changed" }],
      });

      if (loaded.status !== "editingExistingAsset") throw new Error("expected saved");
      if (edited.status !== "editingExistingAsset") throw new Error("expected saved");
      // an edit that reached the baseline would diff as already saved and
      // silently never send
      expect(edited.savedAsset).toBe(loaded.savedAsset);
      expect(localAssetOf(edited).title_1).toEqual([
        { id: "a", fieldContents: "changed" },
      ]);
    });
  });

  describe("editing", () => {
    it("keeps the assetId null while the user types, so the first save is still a create", () => {
      const next = editorReducer(editingNewAsset(), {
        type: "widgetContentsEdited",
        fieldTitle: "title_1",
        contents: [{ fieldContents: "typed" }],
      });

      expect(next.status).toBe("editingNewAsset");
      if (next.status !== "editingNewAsset") return;
      expect(next.localAsset.assetId).toBeNull();
      expect(next.localAsset.modified).toBeNull();
    });

    it("records a widget edit without touching the saved assetId", () => {
      const next = editorReducer(editingExistingAsset(), {
        type: "widgetContentsEdited",
        fieldTitle: "title_1",
        contents: [{ fieldContents: "new title" }],
      });

      expect(next.status).toBe("editingExistingAsset");
      if (next.status !== "editingExistingAsset") return;
      expect(localAssetOf(next).title_1).toEqual([
        { fieldContents: "new title" },
      ]);
      // the assetId lives on the baseline, so no edit can reach it and
      // turn the next save into a create
      expect(localAssetOf(next).assetId).toBe("asset-123");
      expect(next.edits.assetId).toBeUndefined();
      expect(next.edits.modified).toBeUndefined();
    });

    it("drops an edit that arrives when nothing is being edited", () => {
      const next = editorReducer(idle, {
        type: "widgetContentsEdited",
        fieldTitle: "title_1",
        contents: [{ fieldContents: "typed" }],
      });

      expect(next).toBe(idle);
    });

    it("updates the collection on the asset", () => {
      const next = editorReducer(editingNewAsset(), {
        type: "collectionChanged",
        collectionId: 99,
      });

      expect(next.status).toBe("editingNewAsset");
      if (next.status !== "editingNewAsset") return;
      expect(next.localAsset.collectionId).toBe(99);
    });

    it("updates readyForDisplay on the asset", () => {
      const next = editorReducer(editingExistingAsset(), {
        type: "readyForDisplayChanged",
        readyForDisplay: false,
      });

      if (next.status !== "editingExistingAsset") throw new Error("expected");
      expect(localAssetOf(next).readyForDisplay).toBe(false);
      expect(next.edits.readyForDisplay).toBe(false);
    });

    it("updates availableAfter on the asset", () => {
      const next = editorReducer(editingExistingAsset(), {
        type: "availableAfterChanged",
        availableAfter: savedDate,
      });

      if (next.status !== "editingExistingAsset") throw new Error("expected");
      expect(localAssetOf(next).availableAfter).toEqual(savedDate);
    });
  });

  describe("saving", () => {
    it("turns editingNewAsset into editingExistingAsset, keeping in-flight edits", () => {
      const inFlightEdit = makeUnsavedAsset({
        title_1: [{ fieldContents: "typed during the save" }],
      });
      const savedAsset = makeSavedAsset({ assetId: "fresh-from-server" });

      const next = editorReducer(
        editingNewAsset(inFlightEdit, makeTemplate(1, [{ fieldTitle: "title_1" }])),
        {
          type: "saveSucceeded",
          fencingToken: FENCING_TOKEN,
          didCreateAsset: true,
          savedAsset,
        }
      );

      expect(next.status).toBe("editingExistingAsset");
      if (next.status !== "editingExistingAsset") return;
      expect(localAssetOf(next).assetId).toBe("fresh-from-server");
      expect(localAssetOf(next).title_1).toEqual([
        { fieldContents: "typed during the save" },
      ]);
      // the baseline is the response in editor representation, so widget
      // scaffolding does not read as an edit
      expect(next.savedAsset.assetId).toBe("fresh-from-server");
      expect(next.savedAsset.modified).toEqual(savedDate);
      // typing during the save stays pending rather than being reverted by
      // the response
      expect(next.edits.title_1).toEqual([
        { fieldContents: "typed during the save" },
      ]);
    });

    it("drops a save that resolves after a reset, even a create", () => {
      const next = editorReducer(idle, {
        type: "saveSucceeded",
        fencingToken: FENCING_TOKEN,
        didCreateAsset: true,
        savedAsset: makeSavedAsset(),
      });

      expect(next).toBe(idle);
    });

    it("accepts a late create response while the draft is still unsaved, since it carries the only copy of the new assetId", () => {
      const next = editorReducer(editingNewAsset(), {
        type: "saveSucceeded",
        fencingToken: FENCING_TOKEN - 1,
        didCreateAsset: true,
        savedAsset: makeSavedAsset({ assetId: "created-while-away" }),
      });

      expect(next.status).toBe("editingExistingAsset");
      if (next.status !== "editingExistingAsset") return;
      expect(next.savedAsset.assetId).toBe("created-while-away");
    });
  });

  describe("migrating templates", () => {
    it("migrates the asset onto the new template", () => {
      const current = editingExistingAsset(
        makeSavedAsset({
          title_1: [{ fieldContents: "survives the migration" }],
        })
      );

      const next = editorReducer(current, {
        type: "templateMigrated",
        fencingToken: FENCING_TOKEN,
        template: otherTemplate,
      });

      expect(next.status).toBe("editingExistingAsset");
      if (next.status !== "editingExistingAsset") return;
      expect(next.template.templateId).toBe(2);
      expect(localAssetOf(next).templateId).toBe(2);
      expect(localAssetOf(next).title_1).toEqual([
        { fieldContents: "survives the migration" },
      ]);
    });

    it("scaffolds fields the new template adds", () => {
      const next = editorReducer(editingNewAsset(), {
        type: "templateMigrated",
        fencingToken: FENCING_TOKEN,
        template: makeTemplate(2, [{ fieldTitle: "brand_new_field_1" }]),
      });

      if (next.status !== "editingNewAsset") throw new Error("expected editingNewAsset");
      expect(localAssetOf(next).brand_new_field_1).toHaveLength(1);
    });
  });

  it("records a failure to load an existing asset", () => {
    const next = editorReducer(editingExistingAsset(), {
      type: "assetLoadFailed",
      fencingToken: FENCING_TOKEN,
      error: new Error("404"),
    });

    expect(next.status).toBe("loadFailed");
    if (next.status !== "loadFailed") return;
    expect(next.error.message).toBe("404");
  });

  it("returns to idle on reset", () => {
    const next = editorReducer(editingExistingAsset(), { type: "resetRequested" });

    expect(next).toEqual({
      status: "idle",
      fencingToken: FENCING_TOKEN + 1,
    });
  });

  it("starts uninitialized at fencingToken zero", () => {
    expect(initialEditorModel).toEqual({
      status: "idle",
      fencingToken: 0,
    });
  });
});
