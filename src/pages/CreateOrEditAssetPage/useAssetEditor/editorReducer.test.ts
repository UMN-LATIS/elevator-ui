import { describe, it, expect } from "vitest";
import {
  editorReducer,
  initialEditorModel,
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

const GENERATION = 5;

const uninitialized: EditorModel = {
  status: "uninitialized",
  generation: GENERATION,
};

const loadingTemplate: EditorModel = {
  status: "loadingTemplate",
  generation: GENERATION,
  collectionId: 42,
};

const editingNew = (
  localAsset: UnsavedAsset = makeUnsavedAsset()
): EditorModel => ({
  status: "editingNew",
  generation: GENERATION,
  localAsset,
  template: emptyTemplate,
});

const editingSaved = (localAsset: Asset = makeSavedAsset()): EditorModel => ({
  status: "editingSaved",
  generation: GENERATION,
  localAsset,
  savedAsset: makeSavedAsset(),
  template: emptyTemplate,
});

describe("editorReducer", () => {
  describe("starting a new asset", () => {
    it("moves to loadingTemplate and bumps the generation", () => {
      const next = editorReducer(uninitialized, {
        type: "newAssetRequested",
        collectionId: 42,
      });

      expect(next).toEqual({
        status: "loadingTemplate",
        generation: GENERATION + 1,
        collectionId: 42,
      });
    });

    it("builds a fresh unsaved asset when the requested template loads", () => {
      const next = editorReducer(loadingTemplate, {
        type: "templateLoaded",
        generation: GENERATION,
        template: emptyTemplate,
      });

      expect(next.status).toBe("editingNew");
      if (next.status !== "editingNew") return;
      expect(next.localAsset.assetId).toBeNull();
      expect(next.localAsset.modified).toBeNull();
      expect(next.localAsset.collectionId).toBe(42);
    });

    it("scaffolds a field for every widget in the template", () => {
      const template = makeTemplate(1, [
        { fieldTitle: "title_1" },
        { fieldTitle: "notes_1" },
      ]);

      const next = editorReducer(loadingTemplate, {
        type: "templateLoaded",
        generation: GENERATION,
        template,
      });

      if (next.status !== "editingNew") throw new Error("expected editingNew");
      expect(next.localAsset.title_1).toHaveLength(1);
      expect(next.localAsset.notes_1).toHaveLength(1);
      const [titleContent] = next.localAsset.title_1 as { id: string }[];
      expect(titleContent.id).toEqual(expect.any(String));
    });

    it("returns to uninitialized when the template fails to load", () => {
      const next = editorReducer(loadingTemplate, {
        type: "templateLoadFailed",
        generation: GENERATION,
      });

      expect(next.status).toBe("uninitialized");
      expect(next.generation).toBe(GENERATION + 1);
    });
  });

  describe("dropping events from an abandoned session", () => {
    it("drops a template that arrives for a superseded request", () => {
      // the user picked another template, so this model is one generation on
      const superseded: EditorModel = {
        ...loadingTemplate,
        generation: GENERATION + 1,
      };

      const next = editorReducer(superseded, {
        type: "templateLoaded",
        generation: GENERATION,
        template: otherTemplate,
      });

      expect(next).toBe(superseded);
    });

    it("keeps the newest template request rather than the first to resolve", () => {
      const afterSecondRequest = editorReducer(loadingTemplate, {
        type: "newAssetRequested",
        collectionId: 42,
      });

      const slowFirst = editorReducer(afterSecondRequest, {
        type: "templateLoaded",
        generation: GENERATION,
        template: emptyTemplate,
      });
      expect(slowFirst).toBe(afterSecondRequest);

      const second = editorReducer(afterSecondRequest, {
        type: "templateLoaded",
        generation: afterSecondRequest.generation,
        template: otherTemplate,
      });
      if (second.status !== "editingNew") throw new Error("expected editingNew");
      expect(second.template.templateId).toBe(2);
    });

    it("drops a save that resolves into a different editing session", () => {
      // the save was started before the user opened another asset
      const otherSession = editingSaved(makeSavedAsset({ assetId: "asset-B" }));

      const next = editorReducer(otherSession, {
        type: "saveSucceeded",
        generation: GENERATION - 1,
        savedAsset: makeSavedAsset({ assetId: "asset-A" }),
      });

      // accepting it would stamp asset A's id onto asset B's content, and
      // the next save would then overwrite asset A on the server
      expect(next).toBe(otherSession);
    });

    it("drops an asset that arrives for a superseded request", () => {
      const next = editorReducer(editingSaved(), {
        type: "assetLoaded",
        generation: GENERATION - 1,
        savedAsset: makeSavedAsset({ assetId: "stale" }),
        template: otherTemplate,
      });

      expect(next.status).toBe("editingSaved");
      if (next.status !== "editingSaved") return;
      expect(next.localAsset.assetId).toBe("asset-123");
    });

    it("drops a migration that arrives for a superseded request", () => {
      const current = editingSaved();

      const next = editorReducer(current, {
        type: "templateMigrated",
        generation: GENERATION - 1,
        template: otherTemplate,
      });

      expect(next).toBe(current);
    });
  });

  describe("loading an existing asset", () => {
    it("bumps the generation while the request is in flight", () => {
      const next = editorReducer(editingSaved(), { type: "assetRequested" });

      // the current asset stays editable, but operations started under the
      // old generation can no longer land
      expect(next.status).toBe("editingSaved");
      expect(next.generation).toBe(GENERATION + 1);
    });

    it("starts an editingSaved session for the loaded asset", () => {
      const savedAsset = makeSavedAsset({ collectionId: 7 });

      const next = editorReducer(uninitialized, {
        type: "assetLoaded",
        generation: GENERATION,
        savedAsset,
        template: emptyTemplate,
      });

      expect(next.status).toBe("editingSaved");
      if (next.status !== "editingSaved") return;
      expect(next.localAsset.assetId).toBe("asset-123");
      expect(next.localAsset.collectionId).toBe(7);
      expect(next.savedAsset).toEqual(savedAsset);
    });

    it("gives the saved baseline its own nested objects", () => {
      const savedAsset = makeSavedAsset({
        title_1: [{ id: "a", fieldContents: "original" }],
      });

      const next = editorReducer(uninitialized, {
        type: "assetLoaded",
        generation: GENERATION,
        savedAsset,
        template: makeTemplate(1, [{ fieldTitle: "title_1" }]),
      });

      if (next.status !== "editingSaved") throw new Error("expected saved");
      const localContents = next.localAsset.title_1 as { id: string }[];
      const baselineContents = next.savedAsset.title_1 as { id: string }[];
      // sharing them would let an in-place edit hide itself from
      // hasAssetChanged, which compares the two
      expect(localContents[0]).not.toBe(baselineContents[0]);
    });
  });

  describe("editing", () => {
    it("keeps an unsaved editor unsaved whatever the edit payload claims", () => {
      const next = editorReducer(editingNew(), {
        type: "localAssetEdited",
        edit: makeSavedAsset({ assetId: "smuggled-id" }),
      });

      expect(next.status).toBe("editingNew");
      if (next.status !== "editingNew") return;
      expect(next.localAsset.assetId).toBeNull();
      expect(next.localAsset.modified).toBeNull();
    });

    it("restores the model's assetId and modified when a stale edit arrives", () => {
      // losing the assetId would make the next save create a duplicate asset
      const next = editorReducer(editingSaved(), {
        type: "localAssetEdited",
        edit: makeUnsavedAsset({ title: ["typed before the save wrote back"] }),
      });

      expect(next.status).toBe("editingSaved");
      if (next.status !== "editingSaved") return;
      expect(next.localAsset.assetId).toBe("asset-123");
      expect(next.localAsset.modified).toEqual(savedDate);
      expect(next.localAsset.title).toEqual(["typed before the save wrote back"]);
    });

    it("ignores an edit's own assetId in favor of the model's", () => {
      const next = editorReducer(editingSaved(), {
        type: "localAssetEdited",
        edit: makeSavedAsset({ assetId: "some-other-id" }),
      });

      expect(next.status).toBe("editingSaved");
      if (next.status !== "editingSaved") return;
      expect(next.localAsset.assetId).toBe("asset-123");
    });

    it("drops an edit that arrives when nothing is being edited", () => {
      const next = editorReducer(uninitialized, {
        type: "localAssetEdited",
        edit: makeUnsavedAsset(),
      });

      expect(next).toBe(uninitialized);
    });

    it("writes widget contents without touching identity", () => {
      const next = editorReducer(editingSaved(), {
        type: "widgetContentsEdited",
        fieldTitle: "title_1",
        contents: [{ fieldContents: "new title" }],
      });

      expect(next.status).toBe("editingSaved");
      if (next.status !== "editingSaved") return;
      expect(next.localAsset.title_1).toEqual([{ fieldContents: "new title" }]);
      expect(next.localAsset.assetId).toBe("asset-123");
    });

    it("updates the collection on the asset", () => {
      const next = editorReducer(editingNew(), {
        type: "collectionChanged",
        collectionId: 99,
      });

      expect(next.status).toBe("editingNew");
      if (next.status !== "editingNew") return;
      expect(next.localAsset.collectionId).toBe(99);
    });
  });

  describe("saving", () => {
    it("turns editingNew into editingSaved, keeping in-flight edits", () => {
      const inFlightEdit = makeUnsavedAsset({
        title_1: [{ fieldContents: "typed during the save" }],
      });
      const savedAsset = makeSavedAsset({ assetId: "fresh-from-server" });

      const next = editorReducer(editingNew(inFlightEdit), {
        type: "saveSucceeded",
        generation: GENERATION,
        savedAsset,
      });

      expect(next.status).toBe("editingSaved");
      if (next.status !== "editingSaved") return;
      expect(next.localAsset.assetId).toBe("fresh-from-server");
      expect(next.localAsset.title_1).toEqual([
        { fieldContents: "typed during the save" },
      ]);
      expect(next.savedAsset).toEqual(savedAsset);
    });

    it("drops a save that resolves after a reset", () => {
      const next = editorReducer(uninitialized, {
        type: "saveSucceeded",
        generation: GENERATION,
        savedAsset: makeSavedAsset(),
      });

      expect(next).toBe(uninitialized);
    });
  });

  describe("migrating templates", () => {
    it("migrates the asset onto the new template", () => {
      const current = editingSaved(
        makeSavedAsset({
          title_1: [{ fieldContents: "survives the migration" }],
        })
      );

      const next = editorReducer(current, {
        type: "templateMigrated",
        generation: GENERATION,
        template: otherTemplate,
      });

      expect(next.status).toBe("editingSaved");
      if (next.status !== "editingSaved") return;
      expect(next.template.templateId).toBe(2);
      expect(next.localAsset.templateId).toBe(2);
      expect(next.localAsset.title_1).toEqual([
        { fieldContents: "survives the migration" },
      ]);
    });

    it("scaffolds fields the new template adds", () => {
      const next = editorReducer(editingNew(), {
        type: "templateMigrated",
        generation: GENERATION,
        template: makeTemplate(2, [{ fieldTitle: "brand_new_field_1" }]),
      });

      if (next.status !== "editingNew") throw new Error("expected editingNew");
      expect(next.localAsset.brand_new_field_1).toHaveLength(1);
    });
  });

  it("returns to uninitialized on reset", () => {
    const next = editorReducer(editingSaved(), { type: "resetRequested" });

    expect(next).toEqual({
      status: "uninitialized",
      generation: GENERATION + 1,
    });
  });

  it("starts uninitialized at generation zero", () => {
    expect(initialEditorModel).toEqual({
      status: "uninitialized",
      generation: 0,
    });
  });
});
