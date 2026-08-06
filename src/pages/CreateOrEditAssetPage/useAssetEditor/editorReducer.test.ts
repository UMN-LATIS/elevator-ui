import { describe, it, expect } from "vitest";
import {
  editorReducer,
  initialEditorModel,
  selectHasUnsavedEdits,
  selectLocalAsset,
  type EditorEvent,
  type EditorModel,
} from "./editorReducer";
import type {
  Asset,
  PHPDateTime,
  Template,
  UnsavedAsset,
  WidgetDef,
} from "@/types";

// most of these tests are about the model, not the commands a step emits.
// The command-emitting arms have their own describe block
const reduce = (model: EditorModel, event: EditorEvent): EditorModel =>
  editorReducer(model, event).model;

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
  } as unknown as Template);

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

const EDITOR_GENERATION = 5;

/** the generation an operation started under, after the editor moved on */
const STALE_GENERATION = EDITOR_GENERATION - 1;

const idleModel: EditorModel = {
  status: "idle",
  editorGeneration: EDITOR_GENERATION,
};

const loadingTemplateModel: EditorModel = {
  status: "loadingTemplate",
  editorGeneration: EDITOR_GENERATION,
  collectionId: 42,
};

const editingNewAssetModel = (
  localAsset: UnsavedAsset = makeUnsavedAsset(),
  template: Template = emptyTemplate
): EditorModel => ({
  status: "editingNewAsset",
  editorGeneration: EDITOR_GENERATION,
  localAsset,
  template,
});

const editingExistingAssetModel = (
  savedAsset: Asset = makeSavedAsset(),
  edits: Partial<Asset> = {},
  template: Template = emptyTemplate
): EditorModel => ({
  status: "editingExistingAsset",
  editorGeneration: EDITOR_GENERATION,
  savedAsset,
  edits,
  template,
});

/** Narrows the model, failing the test when its status is not the one named. */
function assertStatus<TStatus extends EditorModel["status"]>(
  model: EditorModel,
  status: TStatus
): asserts model is Extract<EditorModel, { status: TStatus }> {
  expect(model.status).toBe(status);
}

/** throws rather than returning null, so tests read without a guard */
const localAssetOf = (model: EditorModel): Asset | UnsavedAsset => {
  const asset = selectLocalAsset(model);
  if (!asset) throw new Error("expected an asset");
  return asset;
};

describe("editorReducer", () => {
  describe("starting a new asset", () => {
    it("moves to loadingTemplate and issues a new editorGeneration", () => {
      const next = reduce(idleModel, {
        type: "newAssetRequested",
        collectionId: 42,
      });

      // the new editorGeneration lets results still in flight be dropped
      // on arrival
      expect(next).toEqual({
        status: "loadingTemplate",
        editorGeneration: EDITOR_GENERATION + 1,
        collectionId: 42,
      });
    });

    it("builds a fresh unsaved asset when the requested template loads", () => {
      const next = reduce(loadingTemplateModel, {
        type: "templateLoaded",
        editorGeneration: EDITOR_GENERATION,
        template: emptyTemplate,
      });

      expect(next.status).toBe("editingNewAsset");
      assertStatus(next, "editingNewAsset");
      expect(localAssetOf(next).assetId).toBeNull();
      expect(localAssetOf(next).modified).toBeNull();
      expect(localAssetOf(next).collectionId).toBe(42);
    });

    it("scaffolds a field for every widget in the template", () => {
      const template = makeTemplate(1, [
        { fieldTitle: "title_1" },
        { fieldTitle: "notes_1" },
      ]);

      const next = reduce(loadingTemplateModel, {
        type: "templateLoaded",
        editorGeneration: EDITOR_GENERATION,
        template,
      });

      assertStatus(next, "editingNewAsset");
      expect(localAssetOf(next).title_1).toHaveLength(1);
      expect(localAssetOf(next).notes_1).toHaveLength(1);
      const [titleContent] = localAssetOf(next).title_1 as { id: string }[];
      expect(titleContent.id).toEqual(expect.any(String));
    });

    it("keeps the error when the template fails to load", () => {
      const next = reduce(loadingTemplateModel, {
        type: "templateLoadFailed",
        editorGeneration: EDITOR_GENERATION,
        error: new Error("network down"),
      });

      expect(next.status).toBe("assetLoadFailed");
      assertStatus(next, "assetLoadFailed");
      expect(next.error.message).toBe("network down");
      expect(next.editorGeneration).toBe(EDITOR_GENERATION + 1);
    });

    it("drops a load failure from an abandoned request", () => {
      const next = reduce(loadingTemplateModel, {
        type: "templateLoadFailed",
        editorGeneration: EDITOR_GENERATION - 1,
        error: new Error("too late"),
      });

      expect(next).toBe(loadingTemplateModel);
    });
  });

  describe("dropping results that carry an old editorGeneration", () => {
    /**
     * A superseded resolution for every event that carries a generation, each
     * paired with a model that would otherwise take it. Keyed by event type,
     * so a resolution event added later will not compile until it is listed
     * here and shown to be dropped.
     */
    const supersededResolutions: Record<
      Extract<EditorEvent, { editorGeneration: number }>["type"],
      { model: EditorModel; event: EditorEvent }
    > = {
      templateLoaded: {
        model: loadingTemplateModel,
        event: {
          type: "templateLoaded",
          editorGeneration: STALE_GENERATION,
          template: otherTemplate,
        },
      },
      templateLoadFailed: {
        model: loadingTemplateModel,
        event: {
          type: "templateLoadFailed",
          editorGeneration: STALE_GENERATION,
          error: new Error("too late"),
        },
      },
      assetLoadFailed: {
        model: editingExistingAssetModel(),
        event: {
          type: "assetLoadFailed",
          editorGeneration: STALE_GENERATION,
          error: new Error("too late"),
        },
      },
      assetLoaded: {
        model: editingExistingAssetModel(),
        event: {
          type: "assetLoaded",
          editorGeneration: STALE_GENERATION,
          savedAsset: makeSavedAsset({ assetId: "stale" }),
          template: otherTemplate,
        },
      },
      templateMigrated: {
        model: editingExistingAssetModel(),
        event: {
          type: "templateMigrated",
          editorGeneration: STALE_GENERATION,
          template: otherTemplate,
        },
      },
      templateMigrationFailed: {
        model: editingExistingAssetModel(),
        event: {
          type: "templateMigrationFailed",
          editorGeneration: STALE_GENERATION,
          error: new Error("too late"),
        },
      },
      assetCreated: {
        model: editingNewAssetModel(),
        event: {
          type: "assetCreated",
          editorGeneration: STALE_GENERATION,
          savedAsset: makeSavedAsset({ assetId: "stale" }),
        },
      },
      saveSucceeded: {
        model: editingExistingAssetModel(),
        event: {
          type: "saveSucceeded",
          editorGeneration: STALE_GENERATION,
          savedAsset: makeSavedAsset({ assetId: "stale" }),
        },
      },
    };

    it.each(Object.entries(supersededResolutions))(
      "drops a superseded %s",
      (_eventType, { model, event }) => {
        expect(reduce(model, event)).toBe(model);
      }
    );

    it("emits no commands for a superseded resolution", () => {
      const { event, model } = supersededResolutions.assetCreated;
      expect(editorReducer(model, event).commands).toEqual([]);
    });

    it("keeps the newest template request rather than the first to resolve", () => {
      // the user picked again before the first template arrived, so pick
      // order must win, not network order
      const afterSecondRequest = reduce(loadingTemplateModel, {
        type: "newAssetRequested",
        collectionId: 42,
      });

      const modelAfterSlowFirstTemplate = reduce(afterSecondRequest, {
        type: "templateLoaded",
        editorGeneration: EDITOR_GENERATION,
        template: emptyTemplate,
      });
      expect(modelAfterSlowFirstTemplate).toBe(afterSecondRequest);

      const modelAfterSecondTemplate = reduce(afterSecondRequest, {
        type: "templateLoaded",
        editorGeneration: afterSecondRequest.editorGeneration,
        template: otherTemplate,
      });
      assertStatus(modelAfterSecondTemplate, "editingNewAsset");
      expect(modelAfterSecondTemplate.template.templateId).toBe(2);
    });

    it("drops a save that resolves after the user opened a different asset", () => {
      // the save was started before the user opened another asset
      const editorOnAssetB = editingExistingAssetModel(
        makeSavedAsset({ assetId: "asset-B" })
      );

      const next = reduce(editorOnAssetB, {
        type: "saveSucceeded",
        editorGeneration: EDITOR_GENERATION - 1,
        savedAsset: makeSavedAsset({ assetId: "asset-A" }),
      });

      // accepting it would stamp asset A's id onto asset B's content, and
      // the next save would then overwrite asset A on the server
      expect(next).toBe(editorOnAssetB);
    });

    it("drops a late create response once the user is editing an existing asset", () => {
      const editorOnAssetB = editingExistingAssetModel(
        makeSavedAsset({ assetId: "asset-B" })
      );

      const next = reduce(editorOnAssetB, {
        type: "saveSucceeded",
        editorGeneration: EDITOR_GENERATION - 1,
        savedAsset: makeSavedAsset({ assetId: "asset-A" }),
      });

      expect(next).toBe(editorOnAssetB);
    });

    it("drops an update response that resolves after the user started a new asset, so the new draft cannot silently overwrite the old asset", () => {
      // the user is editing asset X and a save of it is in flight
      const editingX = editingExistingAssetModel(
        makeSavedAsset({ assetId: "asset-X" })
      );
      const saveGeneration = editingX.editorGeneration;

      // before the save resolves, the user starts a new asset and its
      // template (cached, so near-instant) loads
      const freshDraftLoadingTemplate = reduce(editingX, {
        type: "newAssetRequested",
        collectionId: 42,
      });
      const freshDraft = reduce(freshDraftLoadingTemplate, {
        type: "templateLoaded",
        editorGeneration: freshDraftLoadingTemplate.editorGeneration,
        template: emptyTemplate,
      });

      // asset X's update response finally lands
      const next = reduce(freshDraft, {
        type: "saveSucceeded",
        editorGeneration: saveGeneration,
        savedAsset: makeSavedAsset({ assetId: "asset-X" }),
      });

      // accepting it would adopt asset X as the baseline under the fresh
      // draft, so the next save would overwrite asset X with that draft
      expect(next).toBe(freshDraft);
    });
  });

  describe("loading an existing asset", () => {
    it("issues a new editorGeneration while the request is in flight", () => {
      const next = reduce(editingExistingAssetModel(), {
        type: "existingAssetRequested",
      });

      // the current asset stays editable, but operations started under the
      // old editorGeneration can no longer land
      expect(next.status).toBe("editingExistingAsset");
      expect(next.editorGeneration).toBe(EDITOR_GENERATION + 1);
    });

    it("moves to editingExistingAsset for the loaded asset", () => {
      const savedAsset = makeSavedAsset({ collectionId: 7 });

      const next = reduce(idleModel, {
        type: "assetLoaded",
        editorGeneration: EDITOR_GENERATION,
        savedAsset,
        template: emptyTemplate,
      });

      expect(next.status).toBe("editingExistingAsset");
      assertStatus(next, "editingExistingAsset");
      expect(localAssetOf(next).assetId).toBe("asset-123");
      expect(localAssetOf(next).collectionId).toBe(7);
      expect(next.savedAsset).toEqual(savedAsset);
    });

    it("leaves the saved baseline untouched when a field is edited", () => {
      const template = makeTemplate(1, [{ fieldTitle: "title_1" }]);
      const loaded = reduce(idleModel, {
        type: "assetLoaded",
        editorGeneration: EDITOR_GENERATION,
        savedAsset: makeSavedAsset({
          title_1: [{ id: "a", fieldContents: "original" }],
        }),
        template,
      });

      const edited = reduce(loaded, {
        type: "widgetContentsEdited",
        fieldTitle: "title_1",
        contents: [{ id: "a", fieldContents: "changed" }],
      });

      assertStatus(loaded, "editingExistingAsset");
      assertStatus(edited, "editingExistingAsset");
      // an edit that reached the baseline would diff as already saved and
      // silently never send
      expect(edited.savedAsset).toBe(loaded.savedAsset);
      expect(localAssetOf(edited).title_1).toEqual([
        { id: "a", fieldContents: "changed" },
      ]);
    });
  });

  describe("what counts as unsaved work", () => {
    const template = makeTemplate(1, [{}]);
    const scaffoldContents = [
      { fieldContents: "", isPrimary: false, id: "row-1" },
    ];

    it("reads an untouched draft as clean, so the leave guard stays quiet", () => {
      const pristineDraft = editingNewAssetModel(
        makeUnsavedAsset({ field_1: scaffoldContents }),
        template
      );

      expect(selectHasUnsavedEdits(pristineDraft)).toBe(false);
    });

    it("reads a draft the user typed into as unsaved work", () => {
      const typedDraft = editingNewAssetModel(
        makeUnsavedAsset({
          field_1: [{ fieldContents: "typed", isPrimary: false, id: "row-1" }],
        }),
        template
      );

      expect(selectHasUnsavedEdits(typedDraft)).toBe(true);
    });

    it("reads a draft marked Not Ready as unsaved work", () => {
      const notReadyDraft = editingNewAssetModel(
        makeUnsavedAsset({ field_1: scaffoldContents, readyForDisplay: false }),
        template
      );

      expect(selectHasUnsavedEdits(notReadyDraft)).toBe(true);
    });
  });

  describe("editing", () => {
    it("keeps the assetId null while the user types, so the first save is still a create", () => {
      const next = reduce(editingNewAssetModel(), {
        type: "widgetContentsEdited",
        fieldTitle: "title_1",
        contents: [{ fieldContents: "typed" }],
      });

      expect(next.status).toBe("editingNewAsset");
      assertStatus(next, "editingNewAsset");
      expect(next.localAsset.assetId).toBeNull();
      expect(next.localAsset.modified).toBeNull();
    });

    it("records a widget edit without touching the saved assetId", () => {
      const next = reduce(editingExistingAssetModel(), {
        type: "widgetContentsEdited",
        fieldTitle: "title_1",
        contents: [{ fieldContents: "new title" }],
      });

      expect(next.status).toBe("editingExistingAsset");
      assertStatus(next, "editingExistingAsset");
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
      const next = reduce(idleModel, {
        type: "widgetContentsEdited",
        fieldTitle: "title_1",
        contents: [{ fieldContents: "typed" }],
      });

      expect(next).toBe(idleModel);
    });

    it("updates the collection on the asset", () => {
      const next = reduce(editingNewAssetModel(), {
        type: "collectionChanged",
        collectionId: 99,
      });

      expect(next.status).toBe("editingNewAsset");
      assertStatus(next, "editingNewAsset");
      expect(next.localAsset.collectionId).toBe(99);
    });

    it("updates readyForDisplay on the asset", () => {
      const next = reduce(editingExistingAssetModel(), {
        type: "readyForDisplayChanged",
        readyForDisplay: false,
      });

      assertStatus(next, "editingExistingAsset");
      expect(localAssetOf(next).readyForDisplay).toBe(false);
      expect(next.edits.readyForDisplay).toBe(false);
    });

    it("updates availableAfter on the asset", () => {
      const next = reduce(editingExistingAssetModel(), {
        type: "availableAfterChanged",
        availableAfter: savedDate,
      });

      assertStatus(next, "editingExistingAsset");
      expect(localAssetOf(next).availableAfter).toEqual(savedDate);
    });
  });

  describe("committing a create before the read-back", () => {
    it("takes the new assetId and asks the page to link it", () => {
      const { model: next, commands } = editorReducer(editingNewAssetModel(), {
        type: "assetCreated",
        editorGeneration: EDITOR_GENERATION,
        savedAsset: makeSavedAsset({ assetId: "fresh-from-server" }),
      });

      // editing an existing asset now, so a retry after a failed read-back
      // updates this asset instead of creating another
      assertStatus(next, "editingExistingAsset");
      expect(localAssetOf(next).assetId).toBe("fresh-from-server");
      expect(commands).toEqual([
        { type: "notifyAssetCreated", assetId: "fresh-from-server" },
      ]);
    });

    it("keeps edits typed while the create was in flight pending", () => {
      const template = makeTemplate(1, [{}]);
      const draftTypedDuringSave = makeUnsavedAsset({
        field_1: [
          { fieldContents: "typed during save", isPrimary: false, id: "row-1" },
        ],
      });

      const { model: next } = editorReducer(
        editingNewAssetModel(draftTypedDuringSave, template),
        {
          type: "assetCreated",
          editorGeneration: EDITOR_GENERATION,
          // the draft as it was sent, before the in-flight typing
          savedAsset: makeSavedAsset({
            assetId: "fresh-from-server",
            field_1: [{ fieldContents: "sent", isPrimary: false, id: "row-1" }],
          }),
        }
      );

      assertStatus(next, "editingExistingAsset");
      expect(next.edits.field_1).toEqual([
        { fieldContents: "typed during save", isPrimary: false, id: "row-1" },
      ]);
    });

    it("drops a commit once the editor holds a different asset", () => {
      const model = editingExistingAssetModel();
      const { model: next, commands } = editorReducer(model, {
        type: "assetCreated",
        editorGeneration: EDITOR_GENERATION,
        savedAsset: makeSavedAsset({ assetId: "for-an-abandoned-draft" }),
      });

      expect(next).toBe(model);
      expect(commands).toEqual([]);
    });
  });

  describe("saving", () => {
    it("turns editingNewAsset into editingExistingAsset, keeping in-flight edits", () => {
      const inFlightEdit = makeUnsavedAsset({
        title_1: [{ fieldContents: "typed during the save" }],
      });
      const savedAsset = makeSavedAsset({ assetId: "fresh-from-server" });

      const next = reduce(
        editingNewAssetModel(
          inFlightEdit,
          makeTemplate(1, [{ fieldTitle: "title_1" }])
        ),
        {
          type: "saveSucceeded",
          editorGeneration: EDITOR_GENERATION,
          savedAsset,
        }
      );

      expect(next.status).toBe("editingExistingAsset");
      assertStatus(next, "editingExistingAsset");
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
      const next = reduce(idleModel, {
        type: "saveSucceeded",
        editorGeneration: EDITOR_GENERATION,
        savedAsset: makeSavedAsset(),
      });

      expect(next).toBe(idleModel);
    });

    it("drops a superseded create response, so the next draft cannot adopt an abandoned draft's asset", () => {
      // assetCreated already carried the new id to the draft it belongs to,
      // so this response describes an asset the editor no longer holds
      const model = editingNewAssetModel();
      const next = reduce(model, {
        type: "saveSucceeded",
        editorGeneration: EDITOR_GENERATION - 1,
        savedAsset: makeSavedAsset({ assetId: "created-while-away" }),
      });

      expect(next).toBe(model);
    });
  });

  describe("migrating templates", () => {
    it("migrates the asset onto the new template", () => {
      const current = editingExistingAssetModel(
        makeSavedAsset({
          title_1: [{ fieldContents: "survives the migration" }],
        })
      );

      const next = reduce(current, {
        type: "templateMigrated",
        editorGeneration: EDITOR_GENERATION,
        template: otherTemplate,
      });

      expect(next.status).toBe("editingExistingAsset");
      assertStatus(next, "editingExistingAsset");
      expect(next.template.templateId).toBe(2);
      expect(localAssetOf(next).templateId).toBe(2);
      expect(localAssetOf(next).title_1).toEqual([
        { fieldContents: "survives the migration" },
      ]);
    });

    it("leaves the asset editable on its current template when the migration fails", () => {
      const current = editingExistingAssetModel(
        makeSavedAsset({ title_1: [{ fieldContents: "unsaved work" }] })
      );
      const afterRequest = reduce(current, {
        type: "templateMigrationRequested",
      });

      const next = reduce(afterRequest, {
        type: "templateMigrationFailed",
        editorGeneration: afterRequest.editorGeneration,
        error: new Error("network down"),
      });

      expect(next).toBe(afterRequest);
      assertStatus(next, "editingExistingAsset");
      expect(next.template.templateId).toBe(1);
      expect(localAssetOf(next).title_1).toEqual([
        { fieldContents: "unsaved work" },
      ]);
    });

    it("scaffolds fields the new template adds", () => {
      const next = reduce(editingNewAssetModel(), {
        type: "templateMigrated",
        editorGeneration: EDITOR_GENERATION,
        template: makeTemplate(2, [{ fieldTitle: "brand_new_field_1" }]),
      });

      assertStatus(next, "editingNewAsset");
      expect(localAssetOf(next).brand_new_field_1).toHaveLength(1);
    });

    it("keeps the second template the user picked, whichever request resolves last", () => {
      const firstRequest = reduce(editingExistingAssetModel(), {
        type: "templateMigrationRequested",
      });
      const secondRequest = reduce(firstRequest, {
        type: "templateMigrationRequested",
      });

      // the asset stays editable while its next template loads
      expect(secondRequest.status).toBe("editingExistingAsset");

      const lateFirstTemplate = reduce(secondRequest, {
        type: "templateMigrated",
        editorGeneration: firstRequest.editorGeneration,
        template: otherTemplate,
      });

      expect(lateFirstTemplate).toBe(secondRequest);
    });
  });

  it("records a failure to load an existing asset", () => {
    const next = reduce(editingExistingAssetModel(), {
      type: "assetLoadFailed",
      editorGeneration: EDITOR_GENERATION,
      error: new Error("404"),
    });

    expect(next.status).toBe("assetLoadFailed");
    assertStatus(next, "assetLoadFailed");
    expect(next.error.message).toBe("404");
  });

  it("returns to idle on reset", () => {
    const next = reduce(editingExistingAssetModel(), {
      type: "resetRequested",
    });

    expect(next).toEqual({
      status: "idle",
      editorGeneration: EDITOR_GENERATION + 1,
    });
  });

  it("starts uninitialized at editorGeneration zero", () => {
    expect(initialEditorModel).toEqual({
      status: "idle",
      editorGeneration: 0,
    });
  });
});
