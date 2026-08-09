import { describe, it, expect } from "vitest";
import {
  editorReducer,
  initialEditorModel,
  selectAssetId,
  selectHasUnsavedEdits,
  selectLocalAsset,
  selectTemplateId,
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

const DRAFT_KEY = "draft-key-1";

/** the key of a draft the editor no longer holds */
const STALE_DRAFT_KEY = "draft-key-0";

const idleModel: EditorModel = { status: "idle" };

const awaitingTemplateModel: EditorModel = {
  status: "awaitingTemplate",
  collectionId: 42,
  templateId: 1,
};

const editingNewAssetModel = (
  localAsset: UnsavedAsset = makeUnsavedAsset()
): EditorModel => ({
  status: "editingNewAsset",
  draftKey: DRAFT_KEY,
  localAsset,
  pendingTemplateId: null,
});

const editingExistingAssetModel = (
  edits: Partial<Asset> = {},
  assetId = "asset-123"
): EditorModel => ({
  status: "editingExistingAsset",
  assetId,
  edits,
  pendingTemplateId: null,
});

/** Narrows the model, failing the test when its status is not the one named. */
function assertStatus<TStatus extends EditorModel["status"]>(
  model: EditorModel,
  status: TStatus
): asserts model is Extract<EditorModel, { status: TStatus }> {
  expect(model.status).toBe(status);
}

/** throws rather than returning null, so tests read without a guard */
const localAssetOf = (
  model: EditorModel,
  baseline: Asset | null = null
): Asset | UnsavedAsset => {
  const asset = selectLocalAsset(model, baseline);
  if (!asset) throw new Error("expected an asset");
  return asset;
};

describe("editorReducer", () => {
  describe("starting a new asset", () => {
    it("moves to awaitingTemplate for the requested template", () => {
      const model = reduce(idleModel, {
        type: "newAssetRequested",
        collectionId: 42,
        templateId: 1,
      });

      assertStatus(model, "awaitingTemplate");
      expect(model.collectionId).toBe(42);
      expect(model.templateId).toBe(1);
    });

    it("builds a fresh unsaved asset when the requested template's document arrives", () => {
      const model = reduce(awaitingTemplateModel, {
        type: "templateDocumentLoaded",
        templateId: 1,
        template: emptyTemplate,
      });

      assertStatus(model, "editingNewAsset");
      expect(model.localAsset.assetId).toBeNull();
      expect(model.localAsset.collectionId).toBe(42);
      expect(model.localAsset.templateId).toBe(1);
    });

    it("gives each draft its own key, so a create response can prove which draft it belongs to", () => {
      const first = reduce(awaitingTemplateModel, {
        type: "templateDocumentLoaded",
        templateId: 1,
        template: emptyTemplate,
      });
      const second = reduce(awaitingTemplateModel, {
        type: "templateDocumentLoaded",
        templateId: 1,
        template: emptyTemplate,
      });

      assertStatus(first, "editingNewAsset");
      assertStatus(second, "editingNewAsset");
      expect(first.draftKey).not.toBe(second.draftKey);
    });

    it("scaffolds a field for every widget in the template", () => {
      const template = makeTemplate(1, [{}, {}]);

      const model = reduce(awaitingTemplateModel, {
        type: "templateDocumentLoaded",
        templateId: 1,
        template,
      });

      const draft = localAssetOf(model);
      expect(draft.field_1).toEqual([expect.any(Object)]);
      expect(draft.field_2).toEqual([expect.any(Object)]);
    });

    it("keeps the error when the template fails to load", () => {
      const error = new Error("template load failed");

      const model = reduce(awaitingTemplateModel, {
        type: "templateDocumentLoadFailed",
        templateId: 1,
        error,
      });

      assertStatus(model, "assetLoadFailed");
      expect(model.error).toBe(error);
    });

    it("drops a document for a template the user has moved past", () => {
      const model = reduce(awaitingTemplateModel, {
        type: "templateDocumentLoaded",
        templateId: 99,
        template: makeTemplate(99),
      });

      expect(model).toBe(awaitingTemplateModel);
    });

    it("drops a load failure for a template the user has moved past", () => {
      const model = reduce(awaitingTemplateModel, {
        type: "templateDocumentLoadFailed",
        templateId: 99,
        error: new Error("too late"),
      });

      expect(model).toBe(awaitingTemplateModel);
    });

    it("drops a template document once the editor is editing", () => {
      const editing = editingNewAssetModel();

      const model = reduce(editing, {
        type: "templateDocumentLoaded",
        templateId: 1,
        template: emptyTemplate,
      });

      expect(model).toBe(editing);
    });

    it("keeps the newest template request rather than the first to resolve", () => {
      // the user picks template 1, then re-picks template 2 before 1 arrives
      let model = reduce(idleModel, {
        type: "newAssetRequested",
        collectionId: 42,
        templateId: 1,
      });
      model = reduce(model, {
        type: "newAssetRequested",
        collectionId: 42,
        templateId: 2,
      });

      // template 1 resolves late and must not scaffold the draft
      model = reduce(model, {
        type: "templateDocumentLoaded",
        templateId: 1,
        template: emptyTemplate,
      });
      assertStatus(model, "awaitingTemplate");

      model = reduce(model, {
        type: "templateDocumentLoaded",
        templateId: 2,
        template: otherTemplate,
      });
      assertStatus(model, "editingNewAsset");
      expect(model.localAsset.templateId).toBe(2);
    });
  });

  describe("opening an existing asset", () => {
    it("switches to the asset immediately, holding no document of its own", () => {
      const model = reduce(idleModel, {
        type: "existingAssetRequested",
        assetId: "asset-123",
      });

      assertStatus(model, "editingExistingAsset");
      expect(model.assetId).toBe("asset-123");
      expect(model.edits).toEqual({});
    });

    it("drops the previous asset's edits when opening another asset", () => {
      const editing = editingExistingAssetModel({ readyForDisplay: false });

      const model = reduce(editing, {
        type: "existingAssetRequested",
        assetId: "asset-456",
      });

      assertStatus(model, "editingExistingAsset");
      expect(model.assetId).toBe("asset-456");
      expect(model.edits).toEqual({});
    });

    it("records a failure to load the asset it is opening", () => {
      const error = new Error("load failed");
      const editing = editingExistingAssetModel();

      const model = reduce(editing, {
        type: "assetLoadFailed",
        assetId: "asset-123",
        error,
      });

      assertStatus(model, "assetLoadFailed");
      expect(model.error).toBe(error);
    });

    it("drops a load failure for an asset the editor no longer holds", () => {
      const editing = editingExistingAssetModel({}, "asset-456");

      const model = reduce(editing, {
        type: "assetLoadFailed",
        assetId: "asset-123",
        error: new Error("too late"),
      });

      expect(model).toBe(editing);
    });
  });

  describe("the rebase: baselineRefreshed", () => {
    const refreshed = (
      baseline: Asset,
      template: Template = emptyTemplate
    ): EditorEvent => ({
      type: "baselineRefreshed",
      assetId: baseline.assetId,
      baseline,
      template,
    });

    it("keeps an edit that still differs from the new baseline", () => {
      const editing = editingExistingAssetModel({ readyForDisplay: false });
      const baseline = makeSavedAsset({ readyForDisplay: true });

      const model = reduce(editing, refreshed(baseline));

      assertStatus(model, "editingExistingAsset");
      expect(model.edits).toEqual({ readyForDisplay: false });
    });

    it("drops an edit the new baseline made redundant", () => {
      // the save's read-back carries the edit, so it is no longer unsaved
      const editing = editingExistingAssetModel({ readyForDisplay: false });
      const baseline = makeSavedAsset({ readyForDisplay: false });

      const model = reduce(editing, refreshed(baseline));

      assertStatus(model, "editingExistingAsset");
      expect(model.edits).toEqual({});
    });

    it("lets a refreshed baseline show through fields the user never touched", () => {
      const editing = editingExistingAssetModel({ readyForDisplay: false });
      const baseline = makeSavedAsset({
        readyForDisplay: true,
        field_1: [{ fieldContents: "someone else's edit", uuid: "theirs" }],
      });

      const model = reduce(editing, refreshed(baseline, makeTemplate(1, [{}])));

      const onScreen = localAssetOf(model, baseline);
      expect(onScreen.field_1).toEqual([
        { fieldContents: "someone else's edit", uuid: "theirs" },
      ]);
      expect(onScreen.readyForDisplay).toBe(false);
    });

    it("drops an edit whose only difference is content uuids", () => {
      // a uuid is identity, not content: reminted ids must not read as edits
      const template = makeTemplate(1, [{}]);
      const editing = editingExistingAssetModel({
        field_1: [{ fieldContents: "same", isPrimary: false, uuid: "mine" }],
      });
      const baseline = makeSavedAsset({
        field_1: [{ fieldContents: "same", isPrimary: false, uuid: "stored" }],
      });

      const model = reduce(editing, refreshed(baseline, template));

      assertStatus(model, "editingExistingAsset");
      expect(model.edits).toEqual({});
    });

    it("keeps an unsaved template migration across a refresh", () => {
      // the baseline keeps saying what the server has (templateId 1), so the
      // migration to template 2 must survive as an edit until a save lands it
      const editing = editingExistingAssetModel({ templateId: 2 });
      const baseline = makeSavedAsset({ templateId: 1 });

      const model = reduce(editing, refreshed(baseline, otherTemplate));

      assertStatus(model, "editingExistingAsset");
      expect(model.edits.templateId).toBe(2);
    });

    it("drops a baseline for an asset the editor no longer holds", () => {
      const editing = editingExistingAssetModel({}, "asset-456");
      const baseline = makeSavedAsset({ assetId: "asset-123" });

      const model = reduce(editing, refreshed(baseline));

      expect(model).toBe(editing);
    });

    it("drops a baseline when nothing is being edited", () => {
      const model = reduce(idleModel, refreshed(makeSavedAsset()));

      expect(model).toBe(idleModel);
    });

    it("drops a baseline while a draft is being edited", () => {
      const editing = editingNewAssetModel();

      const model = reduce(editing, refreshed(makeSavedAsset()));

      expect(model).toBe(editing);
    });
  });

  describe("editing", () => {
    it("keeps the assetId null while the user types, so the first save is still a create", () => {
      const model = reduce(editingNewAssetModel(), {
        type: "widgetContentsEdited",
        fieldTitle: "field_1",
        contents: [{ fieldContents: "typed" }],
      });

      expect(localAssetOf(model).assetId).toBeNull();
      expect(localAssetOf(model).field_1).toEqual([{ fieldContents: "typed" }]);
    });

    it("records a widget edit without touching the baseline", () => {
      const baseline = makeSavedAsset();

      const model = reduce(editingExistingAssetModel(), {
        type: "widgetContentsEdited",
        fieldTitle: "field_1",
        contents: [{ fieldContents: "typed" }],
      });

      assertStatus(model, "editingExistingAsset");
      expect(model.edits).toEqual({
        field_1: [{ fieldContents: "typed" }],
      });
      expect(localAssetOf(model, baseline).field_1).toEqual([
        { fieldContents: "typed" },
      ]);
    });

    it("drops an edit that arrives when nothing is being edited", () => {
      const model = reduce(idleModel, {
        type: "widgetContentsEdited",
        fieldTitle: "field_1",
        contents: [{ fieldContents: "typed" }],
      });

      expect(model).toBe(idleModel);
    });

    it("updates the collection on the asset", () => {
      const model = reduce(editingExistingAssetModel(), {
        type: "collectionChanged",
        collectionId: 9,
      });

      assertStatus(model, "editingExistingAsset");
      expect(model.edits.collectionId).toBe(9);
    });

    it("updates readyForDisplay on the asset", () => {
      const model = reduce(editingExistingAssetModel(), {
        type: "readyForDisplayChanged",
        readyForDisplay: false,
      });

      assertStatus(model, "editingExistingAsset");
      expect(model.edits.readyForDisplay).toBe(false);
    });

    it("updates availableAfter on the asset", () => {
      const availableAfter = savedDate;

      const model = reduce(editingExistingAssetModel(), {
        type: "availableAfterChanged",
        availableAfter,
      });

      assertStatus(model, "editingExistingAsset");
      expect(model.edits.availableAfter).toBe(availableAfter);
    });
  });

  describe("committing a create before the read-back", () => {
    const createdEvent = (
      baseline: Asset,
      draftKey = DRAFT_KEY,
      template: Template = emptyTemplate
    ): EditorEvent => ({
      type: "assetCreated",
      draftKey,
      baseline,
      template,
    });

    it("takes the new assetId and asks the page to link it", () => {
      const baseline = makeSavedAsset({ assetId: "asset-new" });

      const step = editorReducer(
        editingNewAssetModel(),
        createdEvent(baseline)
      );

      assertStatus(step.model, "editingExistingAsset");
      expect(step.model.assetId).toBe("asset-new");
      expect(step.commands).toEqual([
        { type: "notifyAssetCreated", assetId: "asset-new" },
      ]);
    });

    it("keeps edits typed while the create was in flight pending", () => {
      // the echoed baseline holds what was sent, so anything typed after the
      // send differs from it and must stay pending for the next save
      const template = makeTemplate(1, [{}]);
      const draft = makeUnsavedAsset({
        field_1: [{ fieldContents: "typed after send", uuid: "row-1" }],
      });
      const echoed = makeSavedAsset({
        assetId: "asset-new",
        field_1: [{ fieldContents: "as sent", uuid: "row-1" }],
      });

      const model = reduce(
        editingNewAssetModel(draft),
        createdEvent(echoed, DRAFT_KEY, template)
      );

      assertStatus(model, "editingExistingAsset");
      expect(model.edits.field_1).toEqual([
        { fieldContents: "typed after send", uuid: "row-1" },
      ]);
    });

    it("drops a create response carrying another draft's key, so the next draft cannot adopt an abandoned draft's asset", () => {
      const editing = editingNewAssetModel();

      const step = editorReducer(
        editing,
        createdEvent(makeSavedAsset(), STALE_DRAFT_KEY)
      );

      expect(step.model).toBe(editing);
      expect(step.commands).toBeUndefined();
    });

    it("drops a create response after a reset, so the orphan can be reported instead", () => {
      const step = editorReducer(idleModel, createdEvent(makeSavedAsset()));

      expect(step.model).toBe(idleModel);
      expect(step.commands).toBeUndefined();
    });

    it("drops a create response once the user is editing an existing asset", () => {
      const editing = editingExistingAssetModel();

      const step = editorReducer(editing, createdEvent(makeSavedAsset()));

      expect(step.model).toBe(editing);
      expect(step.commands).toBeUndefined();
    });
  });

  describe("a save the server accepted", () => {
    const uploadTemplate = makeTemplate(1, [{ type: "upload" }]);

    it("retires the regenerate requests the save carried", () => {
      // `regenerate` is client-only and asks the next save to rebuild derived
      // files. That save has now happened, so leaving the flag set would read
      // as an unsaved change forever
      const editing = editingExistingAssetModel({
        field_1: [{ fileId: "file-1", regenerate: true, uuid: "row-1" }],
      });

      const model = reduce(editing, {
        type: "saveAccepted",
        assetId: "asset-123",
        template: uploadTemplate,
      });

      assertStatus(model, "editingExistingAsset");
      expect(model.edits.field_1).toEqual([
        { fileId: "file-1", uuid: "row-1" },
      ]);
    });

    it("drops an acceptance for an asset the editor no longer holds", () => {
      const editing = editingExistingAssetModel(
        { field_1: [{ fileId: "file-1", regenerate: true, uuid: "row-1" }] },
        "asset-456"
      );

      const model = reduce(editing, {
        type: "saveAccepted",
        assetId: "asset-123",
        template: uploadTemplate,
      });

      expect(model).toBe(editing);
    });
  });

  describe("migrating templates", () => {
    it("migrates a draft onto the new template", () => {
      const draft = makeUnsavedAsset({
        field_1: [{ fieldContents: "kept" }],
      });
      let model = reduce(editingNewAssetModel(draft), {
        type: "templateMigrationRequested",
        templateId: 2,
      });

      model = reduce(model, {
        type: "templateMigrated",
        templateId: 2,
        template: otherTemplate,
        baseline: null,
      });

      assertStatus(model, "editingNewAsset");
      expect(model.localAsset.templateId).toBe(2);
      expect(model.localAsset.field_1).toEqual([{ fieldContents: "kept" }]);
      expect(model.pendingTemplateId).toBeNull();
    });

    it("records a migration as edits against the untouched baseline", () => {
      const baseline = makeSavedAsset({ templateId: 1 });
      let model = reduce(editingExistingAssetModel(), {
        type: "templateMigrationRequested",
        templateId: 2,
      });

      model = reduce(model, {
        type: "templateMigrated",
        templateId: 2,
        template: otherTemplate,
        baseline,
      });

      assertStatus(model, "editingExistingAsset");
      expect(model.edits.templateId).toBe(2);
      expect(localAssetOf(model, baseline).templateId).toBe(2);
    });

    it("scaffolds fields the new template adds", () => {
      const templateWithField = makeTemplate(2, [{}]);
      const baseline = makeSavedAsset({ templateId: 1 });
      let model = reduce(editingExistingAssetModel(), {
        type: "templateMigrationRequested",
        templateId: 2,
      });

      model = reduce(model, {
        type: "templateMigrated",
        templateId: 2,
        template: templateWithField,
        baseline,
      });

      const migrated = localAssetOf(model, baseline);
      expect(migrated.field_1).toEqual([expect.any(Object)]);
    });

    it("leaves the asset editable on its current template when the migration fails", () => {
      let model = reduce(editingExistingAssetModel(), {
        type: "templateMigrationRequested",
        templateId: 2,
      });

      model = reduce(model, {
        type: "templateMigrationFailed",
        templateId: 2,
        error: new Error("migration failed"),
      });

      assertStatus(model, "editingExistingAsset");
      expect(model.edits).toEqual({});
      expect(model.pendingTemplateId).toBeNull();
    });

    it("keeps the second template the user picked, whichever request resolves last", () => {
      const baseline = makeSavedAsset({ templateId: 1 });
      let model = reduce(editingExistingAssetModel(), {
        type: "templateMigrationRequested",
        templateId: 2,
      });
      model = reduce(model, {
        type: "templateMigrationRequested",
        templateId: 3,
      });

      // template 2 resolves late: the user has moved on to template 3
      model = reduce(model, {
        type: "templateMigrated",
        templateId: 2,
        template: otherTemplate,
        baseline,
      });
      assertStatus(model, "editingExistingAsset");
      expect(model.edits.templateId).toBeUndefined();

      model = reduce(model, {
        type: "templateMigrated",
        templateId: 3,
        template: makeTemplate(3),
        baseline,
      });
      assertStatus(model, "editingExistingAsset");
      expect(model.edits.templateId).toBe(3);
    });

    it("drops a migration that was never requested", () => {
      const editing = editingExistingAssetModel();

      const model = reduce(editing, {
        type: "templateMigrated",
        templateId: 2,
        template: otherTemplate,
        baseline: makeSavedAsset(),
      });

      expect(model).toBe(editing);
    });

    it("drops a migration whose baseline is for an asset the editor no longer holds", () => {
      let model = reduce(editingExistingAssetModel({}, "asset-456"), {
        type: "templateMigrationRequested",
        templateId: 2,
      });
      const before = model;

      model = reduce(model, {
        type: "templateMigrated",
        templateId: 2,
        template: otherTemplate,
        baseline: makeSavedAsset({ assetId: "asset-123" }),
      });

      expect(model).toBe(before);
    });
  });

  describe("naming the asset and template the editor needs", () => {
    it("names no asset while nothing is loaded", () => {
      expect(selectAssetId(idleModel)).toBeNull();
      expect(selectAssetId(editingNewAssetModel())).toBeNull();
    });

    it("names the asset being edited", () => {
      expect(selectAssetId(editingExistingAssetModel())).toBe("asset-123");
    });

    it("names the requested template while the draft awaits its document", () => {
      expect(selectTemplateId(awaitingTemplateModel, null)).toBe(1);
    });

    it("names the draft's template", () => {
      expect(selectTemplateId(editingNewAssetModel(), null)).toBe(1);
    });

    it("names the baseline's template for an untouched existing asset", () => {
      const baseline = makeSavedAsset({ templateId: 7 });
      expect(selectTemplateId(editingExistingAssetModel(), baseline)).toBe(7);
    });

    it("names the migrated template over the baseline's, so a pending migration wins", () => {
      const baseline = makeSavedAsset({ templateId: 1 });
      const migrating = editingExistingAssetModel({ templateId: 2 });
      expect(selectTemplateId(migrating, baseline)).toBe(2);
    });

    it("ignores a baseline for an asset the editor no longer holds", () => {
      const staleBaseline = makeSavedAsset({ assetId: "asset-old" });
      expect(
        selectTemplateId(editingExistingAssetModel(), staleBaseline)
      ).toBeNull();
    });

    it("names no template when nothing is loading or loaded", () => {
      expect(selectTemplateId(idleModel, null)).toBeNull();
      expect(selectTemplateId(editingExistingAssetModel(), null)).toBeNull();
    });
  });

  describe("the asset on screen", () => {
    it("lays pending edits over the baseline", () => {
      const baseline = makeSavedAsset({ readyForDisplay: true });
      const editing = editingExistingAssetModel({ readyForDisplay: false });

      const onScreen = localAssetOf(editing, baseline);

      expect(onScreen.readyForDisplay).toBe(false);
      expect(onScreen.assetId).toBe("asset-123");
    });

    it("shows nothing until the baseline document has arrived", () => {
      expect(selectLocalAsset(editingExistingAssetModel(), null)).toBeNull();
    });

    it("shows nothing over a baseline for an asset the editor no longer holds", () => {
      const staleBaseline = makeSavedAsset({ assetId: "asset-old" });
      expect(
        selectLocalAsset(editingExistingAssetModel(), staleBaseline)
      ).toBeNull();
    });

    it("shows the draft without needing any baseline", () => {
      const draft = makeUnsavedAsset();
      expect(selectLocalAsset(editingNewAssetModel(draft), null)).toBe(draft);
    });
  });

  describe("what counts as unsaved work", () => {
    const template = makeTemplate(1, [{}]);

    const draftFromTemplate = (): EditorModel =>
      reduce(
        { status: "awaitingTemplate", collectionId: 1, templateId: 1 },
        { type: "templateDocumentLoaded", templateId: 1, template }
      );

    it("reads an untouched draft as clean, so the leave guard stays quiet", () => {
      expect(selectHasUnsavedEdits(draftFromTemplate(), null, template)).toBe(
        false
      );
    });

    it("reads a draft the user typed into as unsaved work", () => {
      const model = reduce(draftFromTemplate(), {
        type: "widgetContentsEdited",
        fieldTitle: "field_1",
        contents: [{ fieldContents: "typed" }],
      });

      expect(selectHasUnsavedEdits(model, null, template)).toBe(true);
    });

    it("reads an edit the server would store as unsaved work", () => {
      const baseline = makeSavedAsset({
        field_1: [{ fieldContents: "saved", uuid: "row-1" }],
      });
      const model = reduce(editingExistingAssetModel(), {
        type: "widgetContentsEdited",
        fieldTitle: "field_1",
        contents: [{ fieldContents: "changed", uuid: "row-1" }],
      });

      expect(selectHasUnsavedEdits(model, baseline, template)).toBe(true);
    });

    it("reads an edit set back to the saved value as clean", () => {
      const baseline = makeSavedAsset({
        field_1: [{ fieldContents: "saved", uuid: "row-1" }],
      });
      let model = reduce(editingExistingAssetModel(), {
        type: "widgetContentsEdited",
        fieldTitle: "field_1",
        contents: [{ fieldContents: "changed", uuid: "row-1" }],
      });
      model = reduce(model, {
        type: "widgetContentsEdited",
        fieldTitle: "field_1",
        contents: [{ fieldContents: "saved", uuid: "row-1" }],
      });

      expect(selectHasUnsavedEdits(model, baseline, template)).toBe(false);
    });

    it("reads as clean while the baseline document has not arrived", () => {
      const model = editingExistingAssetModel({ readyForDisplay: false });
      expect(selectHasUnsavedEdits(model, null, template)).toBe(false);
    });

    it("reads as clean while the template document has not arrived, whatever the draft holds", () => {
      const model = reduce(draftFromTemplate(), {
        type: "widgetContentsEdited",
        fieldTitle: "field_1",
        contents: [{ fieldContents: "typed" }],
      });

      expect(selectHasUnsavedEdits(model, null, null)).toBe(false);
    });
  });

  it("returns to idle on reset", () => {
    const model = reduce(editingExistingAssetModel(), {
      type: "resetRequested",
    });

    expect(model).toEqual({ status: "idle" });
  });

  it("starts uninitialized", () => {
    expect(initialEditorModel).toEqual({ status: "idle" });
  });
});
