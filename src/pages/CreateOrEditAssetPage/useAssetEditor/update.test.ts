import { describe, it, expect } from "vitest";
import { update } from "./update";
import {
  initialEditorState,
  type EditingAsset,
  type EditorDeps,
  type EditorEvent,
  type EditorState,
  type ParentLink,
} from "./types";
import {
  selectAssetId,
  selectHasUnsavedEdits,
  selectLocalAsset,
  selectOpenAsset,
  selectKeyAndDescendants,
  selectStatus,
  selectTemplateId,
} from "./selectors";
import type {
  Asset,
  PHPDateTime,
  Template,
  UnsavedAsset,
  WidgetDef,
} from "@/types";

const makeDeps = (): EditorDeps => {
  let n = 0;
  return { createUuid: () => `created-${++n}` };
};

// most of these tests are about the state, not the effects a step emits.
// The effect-emitting arms have their own describe block
const reduce = (state: EditorState, event: EditorEvent): EditorState =>
  update(state, event, makeDeps()).state;

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

const makeUnsavedAsset = (
  overrides: Partial<UnsavedAsset> = {}
): UnsavedAsset => ({
  ...requiredAssetFields,
  assetId: null,
  modified: null,
  ...overrides,
});

const ROOT_KEY = "session-root";
const CHILD_KEY = "session-child";

/** the key of an edit session that was closed or never opened */
const UNKNOWN_KEY = "session-unknown";

const awaitingTemplateOpenAsset: EditingAsset = {
  status: "awaitingTemplate",
  parentLink: null,
  collectionId: 42,
  templateId: 1,
};

const editingNewOpenAsset = ({
  draft = makeUnsavedAsset(),
  template = emptyTemplate,
}: {
  draft?: UnsavedAsset;
  template?: Template;
} = {}): Extract<EditingAsset, { status: "editingNewAsset" }> => ({
  status: "editingNewAsset",
  parentLink: null,
  draft,
  template,
  pendingTemplateId: null,
  saveState: "idle",
});

const editingExistingOpenAsset = ({
  edits = {},
  assetId = "asset-123",
  savedAsset = null,
  template = null,
}: {
  edits?: Partial<Asset>;
  assetId?: string;
  savedAsset?: Asset | null;
  template?: Template | null;
} = {}): EditingAsset => ({
  status: "editingExistingAsset",
  parentLink: null,
  assetId,
  savedAsset,
  template,
  edits,
  pendingTemplateId: null,
  saveState: "idle",
});

const rootState = (openAsset: EditingAsset): EditorState => ({
  assets: { [ROOT_KEY]: openAsset },
  rootKey: ROOT_KEY,
});

/** a child mounted under the root's related_1 item "item-1" */
const childLink: ParentLink = {
  key: ROOT_KEY,
  fieldTitle: "related_1",
  itemUuid: "item-1",
};

const withChildOpenAsset = (
  state: EditorState,
  openAsset: EditingAsset
): EditorState => ({
  ...state,
  assets: { ...state.assets, [CHILD_KEY]: openAsset },
});

/**
 * Narrows an open asset, failing the test when its status is not the one
 * named.
 */
function assertStatus<TStatus extends EditingAsset["status"]>(
  openAsset: EditingAsset | null,
  status: TStatus
): asserts openAsset is Extract<EditingAsset, { status: TStatus }> {
  expect(openAsset?.status).toBe(status);
}

/** throws rather than returning null, so tests read without a guard */
const localAssetOf = (
  state: EditorState,
  key: string
): Asset | UnsavedAsset => {
  const asset = selectLocalAsset(state, key);
  if (!asset) throw new Error("expected an asset");
  return asset;
};

describe("update", () => {
  describe("opening and closing assets", () => {
    it("opens a root asset awaiting its template", () => {
      const step = update(
        initialEditorState,
        {
          type: "newAssetRequested",
          key: ROOT_KEY,
          parentLink: null,
          collectionId: 42,
          templateId: 1,
        },
        makeDeps()
      );

      expect(step.state.rootKey).toBe(ROOT_KEY);
      assertStatus(selectOpenAsset(step.state, ROOT_KEY), "awaitingTemplate");
      expect(step.effects).toEqual([
        { type: "fetchTemplate", key: ROOT_KEY, templateId: 1 },
      ]);
    });

    it("names no asset open when nothing is", () => {
      expect(selectStatus(initialEditorState, ROOT_KEY)).toBe("noAssetOpen");
    });

    it("replaces the previous root asset when a new root opens", () => {
      // the page reuses one editor across route changes, so nothing unmounts
      // to close the old root: opening the next root retires it
      const state = reduce(rootState(editingExistingOpenAsset()), {
        type: "existingAssetRequested",
        key: "session-root-2",
        parentLink: null,
        assetId: "asset-456",
      });

      expect(state.rootKey).toBe("session-root-2");
      expect(selectOpenAsset(state, ROOT_KEY)).toBeNull();
      assertStatus(
        selectOpenAsset(state, "session-root-2"),
        "editingExistingAsset"
      );
    });

    it("keeps the root in place when a child opens", () => {
      const state = reduce(rootState(editingExistingOpenAsset()), {
        type: "existingAssetRequested",
        key: CHILD_KEY,
        parentLink: childLink,
        assetId: "asset-456",
      });

      expect(state.rootKey).toBe(ROOT_KEY);
      expect(selectOpenAsset(state, ROOT_KEY)).not.toBeNull();
      expect(selectOpenAsset(state, CHILD_KEY)).not.toBeNull();
    });

    it("removes a closed asset", () => {
      const state = reduce(
        withChildOpenAsset(rootState(editingExistingOpenAsset()), {
          ...editingNewOpenAsset(),
          parentLink: childLink,
        }),
        { type: "assetClosed", key: CHILD_KEY }
      );

      expect(selectOpenAsset(state, CHILD_KEY)).toBeNull();
      expect(state.rootKey).toBe(ROOT_KEY);
    });

    it("clears the root key when the root asset closes", () => {
      const state = reduce(rootState(editingExistingOpenAsset()), {
        type: "assetClosed",
        key: ROOT_KEY,
      });

      expect(state.rootKey).toBeNull();
      expect(state.assets).toEqual({});
    });

    it("empties out on reset", () => {
      const state = reduce(rootState(editingExistingOpenAsset()), {
        type: "resetRequested",
      });

      expect(state).toEqual({ assets: {}, rootKey: null });
    });
  });

  describe("starting a new asset", () => {
    it("builds a new unsaved asset when the requested template arrives", () => {
      const state = reduce(rootState(awaitingTemplateOpenAsset), {
        type: "templateArrived",
        key: ROOT_KEY,
        templateId: 1,
        template: emptyTemplate,
      });

      const openAsset = selectOpenAsset(state, ROOT_KEY);
      assertStatus(openAsset, "editingNewAsset");
      expect(openAsset.draft.assetId).toBeNull();
      expect(openAsset.draft.collectionId).toBe(42);
      expect(openAsset.draft.templateId).toBe(1);
    });

    it("builds a blank field for every widget in the template", () => {
      const template = makeTemplate(1, [{}, {}]);

      const state = reduce(rootState(awaitingTemplateOpenAsset), {
        type: "templateArrived",
        key: ROOT_KEY,
        templateId: 1,
        template,
      });

      const draft = localAssetOf(state, ROOT_KEY);
      expect(draft.field_1).toEqual([expect.any(Object)]);
      expect(draft.field_2).toEqual([expect.any(Object)]);
    });

    it("keeps the error when the template fails to load", () => {
      const error = new Error("template load failed");

      const state = reduce(rootState(awaitingTemplateOpenAsset), {
        type: "templateLoadFailed",
        key: ROOT_KEY,
        templateId: 1,
        error,
      });

      assertStatus(selectOpenAsset(state, ROOT_KEY), "loadFailed");
    });

    it("drops a template the user has moved past", () => {
      const before = rootState(awaitingTemplateOpenAsset);

      const state = reduce(before, {
        type: "templateArrived",
        key: ROOT_KEY,
        templateId: 99,
        template: makeTemplate(99),
      });

      expect(state).toBe(before);
    });

    it("drops a template once the asset is editing", () => {
      const before = rootState(editingNewOpenAsset());

      const state = reduce(before, {
        type: "templateArrived",
        key: ROOT_KEY,
        templateId: 1,
        template: emptyTemplate,
      });

      expect(state).toBe(before);
    });

    it("drops a template for an asset that has closed", () => {
      const before = rootState(awaitingTemplateOpenAsset);

      const state = reduce(before, {
        type: "templateArrived",
        key: UNKNOWN_KEY,
        templateId: 1,
        template: emptyTemplate,
      });

      expect(state).toBe(before);
    });

    it("keeps the newest template request rather than the first to resolve", () => {
      // the user picks template 1, then re-picks template 2 before 1 arrives.
      // Each request rewrites the same root asset.
      const deps = makeDeps();
      let state = update(
        initialEditorState,
        {
          type: "newAssetRequested",
          key: ROOT_KEY,
          parentLink: null,
          collectionId: 42,
          templateId: 1,
        },
        deps
      ).state;
      state = update(
        state,
        {
          type: "newAssetRequested",
          key: "session-root-2",
          parentLink: null,
          collectionId: 42,
          templateId: 2,
        },
        deps
      ).state;

      // template 1 resolves late, addressed to the retired open asset
      state = update(
        state,
        {
          type: "templateArrived",
          key: ROOT_KEY,
          templateId: 1,
          template: emptyTemplate,
        },
        deps
      ).state;
      expect(selectOpenAsset(state, ROOT_KEY)).toBeNull();

      state = update(
        state,
        {
          type: "templateArrived",
          key: "session-root-2",
          templateId: 2,
          template: otherTemplate,
        },
        deps
      ).state;
      const openAsset = selectOpenAsset(state, "session-root-2");
      assertStatus(openAsset, "editingNewAsset");
      expect(openAsset.draft.templateId).toBe(2);
    });
  });

  describe("opening an existing asset", () => {
    it("holds only the asset's identity, no document", () => {
      const step = update(
        initialEditorState,
        {
          type: "existingAssetRequested",
          key: ROOT_KEY,
          parentLink: null,
          assetId: "asset-123",
        },
        makeDeps()
      );

      const openAsset = selectOpenAsset(step.state, ROOT_KEY);
      assertStatus(openAsset, "editingExistingAsset");
      expect(openAsset.assetId).toBe("asset-123");
      expect(openAsset.edits).toEqual({});
      expect(step.effects).toEqual([
        {
          type: "fetchAssetAndTemplate",
          key: ROOT_KEY,
          assetId: "asset-123",
        },
      ]);
    });

    it("records a failure to load the asset", () => {
      const error = new Error("load failed");

      const state = reduce(rootState(editingExistingOpenAsset()), {
        type: "assetLoadFailed",
        key: ROOT_KEY,
        error,
      });

      assertStatus(selectOpenAsset(state, ROOT_KEY), "loadFailed");
    });

    it("drops a load failure for an asset that has closed", () => {
      const before = rootState(editingExistingOpenAsset());

      const state = reduce(before, {
        type: "assetLoadFailed",
        key: UNKNOWN_KEY,
        error: new Error("too late"),
      });

      expect(state).toBe(before);
    });
  });

  describe("the rebase: assetAndTemplateArrived", () => {
    const assetAndTemplateArrived = (
      asset: Asset,
      template: Template = emptyTemplate,
      key = ROOT_KEY
    ): EditorEvent => ({
      type: "assetAndTemplateArrived",
      key,
      asset,
      template,
    });

    it("keeps an edit that still differs from the new saved asset", () => {
      const state = reduce(
        rootState(
          editingExistingOpenAsset({ edits: { readyForDisplay: false } })
        ),
        assetAndTemplateArrived(makeSavedAsset({ readyForDisplay: true }))
      );

      const openAsset = selectOpenAsset(state, ROOT_KEY);
      assertStatus(openAsset, "editingExistingAsset");
      expect(openAsset.edits).toEqual({ readyForDisplay: false });
    });

    it("drops an edit the new saved asset made redundant", () => {
      const state = reduce(
        rootState(
          editingExistingOpenAsset({ edits: { readyForDisplay: false } })
        ),
        assetAndTemplateArrived(makeSavedAsset({ readyForDisplay: false }))
      );

      const openAsset = selectOpenAsset(state, ROOT_KEY);
      assertStatus(openAsset, "editingExistingAsset");
      expect(openAsset.edits).toEqual({});
    });

    it("lets a refreshed saved asset show through fields the user never touched", () => {
      const asset = makeSavedAsset({
        readyForDisplay: true,
        field_1: [{ fieldContents: "someone else's edit", uuid: "theirs" }],
      });

      const state = reduce(
        rootState(
          editingExistingOpenAsset({ edits: { readyForDisplay: false } })
        ),
        assetAndTemplateArrived(asset, makeTemplate(1, [{}]))
      );

      const onScreen = localAssetOf(state, ROOT_KEY);
      expect(onScreen.field_1).toEqual([
        { fieldContents: "someone else's edit", uuid: "theirs" },
      ]);
      expect(onScreen.readyForDisplay).toBe(false);
    });

    it("drops an edit whose only difference is content uuids", () => {
      const template = makeTemplate(1, [{}]);
      const state = reduce(
        rootState(
          editingExistingOpenAsset({
            edits: {
              field_1: [
                { fieldContents: "same", isPrimary: false, uuid: "mine" },
              ],
            },
          })
        ),
        assetAndTemplateArrived(
          makeSavedAsset({
            field_1: [
              { fieldContents: "same", isPrimary: false, uuid: "stored" },
            ],
          }),
          template
        )
      );

      const openAsset = selectOpenAsset(state, ROOT_KEY);
      assertStatus(openAsset, "editingExistingAsset");
      expect(openAsset.edits).toEqual({});
    });

    it("keeps an unsaved template migration across a refresh", () => {
      const state = reduce(
        rootState(
          editingExistingOpenAsset({
            edits: { templateId: 2 },
            template: otherTemplate,
          })
        ),
        assetAndTemplateArrived(
          makeSavedAsset({ templateId: 1 }),
          otherTemplate
        )
      );

      const openAsset = selectOpenAsset(state, ROOT_KEY);
      assertStatus(openAsset, "editingExistingAsset");
      expect(openAsset.edits.templateId).toBe(2);
    });

    it("drops an arrival for an asset the session does not hold", () => {
      const before = rootState(
        editingExistingOpenAsset({ assetId: "asset-456" })
      );

      const state = reduce(
        before,
        assetAndTemplateArrived(makeSavedAsset({ assetId: "asset-123" }))
      );

      expect(state).toBe(before);
    });

    it("drops an arrival for an asset that has closed", () => {
      const before = rootState(editingExistingOpenAsset());

      const state = reduce(
        before,
        assetAndTemplateArrived(makeSavedAsset(), emptyTemplate, UNKNOWN_KEY)
      );

      expect(state).toBe(before);
    });

    it("leaves other open assets alone", () => {
      const childOpenAsset: EditingAsset = {
        ...editingExistingOpenAsset({
          edits: { readyForDisplay: false },
          assetId: "asset-456",
        }),
        parentLink: childLink,
      };
      const before = withChildOpenAsset(
        rootState(editingExistingOpenAsset()),
        childOpenAsset
      );

      const state = reduce(before, assetAndTemplateArrived(makeSavedAsset()));

      expect(selectOpenAsset(state, CHILD_KEY)).toBe(childOpenAsset);
    });
  });

  describe("editing", () => {
    it("keeps the assetId null while the user types, so the first save is still a create", () => {
      const state = reduce(rootState(editingNewOpenAsset()), {
        type: "widgetContentsEdited",
        key: ROOT_KEY,
        fieldTitle: "field_1",
        contents: [{ fieldContents: "typed" }],
      });

      expect(localAssetOf(state, ROOT_KEY).assetId).toBeNull();
      expect(localAssetOf(state, ROOT_KEY).field_1).toEqual([
        { fieldContents: "typed" },
      ]);
    });

    it("records a widget edit without touching the saved asset", () => {
      const savedAsset = makeSavedAsset();

      const state = reduce(
        rootState(editingExistingOpenAsset({ savedAsset })),
        {
          type: "widgetContentsEdited",
          key: ROOT_KEY,
          fieldTitle: "field_1",
          contents: [{ fieldContents: "typed" }],
        }
      );

      const openAsset = selectOpenAsset(state, ROOT_KEY);
      assertStatus(openAsset, "editingExistingAsset");
      expect(openAsset.edits).toEqual({
        field_1: [{ fieldContents: "typed" }],
      });
      expect(openAsset.savedAsset).toBe(savedAsset);
      expect(localAssetOf(state, ROOT_KEY).field_1).toEqual([
        { fieldContents: "typed" },
      ]);
    });

    it("drops an edit for an asset that has closed", () => {
      const before = rootState(editingExistingOpenAsset());

      const state = reduce(before, {
        type: "widgetContentsEdited",
        key: UNKNOWN_KEY,
        fieldTitle: "field_1",
        contents: [{ fieldContents: "typed" }],
      });

      expect(state).toBe(before);
    });

    it("updates the collection on the asset", () => {
      const state = reduce(rootState(editingExistingOpenAsset()), {
        type: "collectionChanged",
        key: ROOT_KEY,
        collectionId: 9,
      });

      const openAsset = selectOpenAsset(state, ROOT_KEY);
      assertStatus(openAsset, "editingExistingAsset");
      expect(openAsset.edits.collectionId).toBe(9);
    });

    it("updates readyForDisplay on the asset", () => {
      const state = reduce(rootState(editingExistingOpenAsset()), {
        type: "readyForDisplayChanged",
        key: ROOT_KEY,
        readyForDisplay: false,
      });

      const openAsset = selectOpenAsset(state, ROOT_KEY);
      assertStatus(openAsset, "editingExistingAsset");
      expect(openAsset.edits.readyForDisplay).toBe(false);
    });

    it("updates availableAfter on the asset", () => {
      const state = reduce(rootState(editingExistingOpenAsset()), {
        type: "availableAfterChanged",
        key: ROOT_KEY,
        availableAfter: savedDate,
      });

      const openAsset = selectOpenAsset(state, ROOT_KEY);
      assertStatus(openAsset, "editingExistingAsset");
      expect(openAsset.edits.availableAfter).toBe(savedDate);
    });
  });

  describe("a completed upload", () => {
    // no file may be orphaned: an appended upload item is followed by a
    // save request, always. The rule lives in this one arm instead of an
    // emit chain four components long.
    const uploadedContents = [{ fileId: "file-1", uuid: "item-1" }];

    it("writes the items and asks for a save in the same step", () => {
      const step = update(
        rootState(editingExistingOpenAsset()),
        {
          type: "uploadCompleted",
          key: ROOT_KEY,
          fieldTitle: "upload_1",
          contents: uploadedContents,
        },
        makeDeps()
      );

      const openAsset = selectOpenAsset(step.state, ROOT_KEY);
      assertStatus(openAsset, "editingExistingAsset");
      expect(openAsset.edits.upload_1).toEqual(uploadedContents);
      expect(step.effects).toEqual([{ type: "requestSave", key: ROOT_KEY }]);
    });

    it("writes into a draft the same way", () => {
      const step = update(
        rootState(editingNewOpenAsset()),
        {
          type: "uploadCompleted",
          key: ROOT_KEY,
          fieldTitle: "upload_1",
          contents: uploadedContents,
        },
        makeDeps()
      );

      const openAsset = selectOpenAsset(step.state, ROOT_KEY);
      assertStatus(openAsset, "editingNewAsset");
      expect(openAsset.draft.upload_1).toEqual(uploadedContents);
      expect(step.effects).toEqual([{ type: "requestSave", key: ROOT_KEY }]);
    });

    it("asks for nothing when the asset has closed", () => {
      const before = rootState(editingExistingOpenAsset());

      const step = update(
        before,
        {
          type: "uploadCompleted",
          key: UNKNOWN_KEY,
          fieldTitle: "upload_1",
          contents: uploadedContents,
        },
        makeDeps()
      );

      expect(step.state).toBe(before);
      expect(step.effects).toBeUndefined();
    });
  });

  describe("committing a create before the read-back", () => {
    it("takes the new assetId and asks the page to link it", () => {
      const openAsset = editingNewOpenAsset();

      const step = update(
        rootState(openAsset),
        {
          type: "assetCreated",
          key: ROOT_KEY,
          assetId: "asset-new",
          sentAsset: openAsset.draft,
        },
        makeDeps()
      );

      const resultOpenAsset = selectOpenAsset(step.state, ROOT_KEY);
      assertStatus(resultOpenAsset, "editingExistingAsset");
      expect(resultOpenAsset.assetId).toBe("asset-new");
      expect(step.effects).toEqual([
        { type: "notifyAssetCreated", key: ROOT_KEY, assetId: "asset-new" },
      ]);
    });

    it("keeps edits typed while the create was in flight pending", () => {
      const template = makeTemplate(1, [{}]);
      const sentAsset = makeUnsavedAsset({
        field_1: [{ fieldContents: "as sent", uuid: "row-1" }],
      });
      const currentDraft = makeUnsavedAsset({
        field_1: [{ fieldContents: "typed after send", uuid: "row-1" }],
      });

      const state = reduce(
        rootState(editingNewOpenAsset({ draft: currentDraft, template })),
        {
          type: "assetCreated",
          key: ROOT_KEY,
          assetId: "asset-new",
          sentAsset,
        }
      );

      const openAsset = selectOpenAsset(state, ROOT_KEY);
      assertStatus(openAsset, "editingExistingAsset");
      expect(openAsset.edits.field_1).toEqual([
        { fieldContents: "typed after send", uuid: "row-1" },
      ]);
    });

    it("drops a create response for an asset that has closed, and says the asset is orphaned", () => {
      // abandoning a draft closes it. The next draft opens under a new key,
      // which this response does not carry. The asset exists with nothing
      // pointing at it, which the user must hear.
      const before = rootState(editingNewOpenAsset());

      const step = update(
        before,
        {
          type: "assetCreated",
          key: UNKNOWN_KEY,
          assetId: "asset-orphan",
          sentAsset: makeUnsavedAsset(),
        },
        makeDeps()
      );

      expect(step.state).toBe(before);
      expect(step.effects).toEqual([
        { type: "notifyCreateDropped", assetId: "asset-orphan" },
      ]);
    });

    it("drops a create response once the session holds an existing asset", () => {
      const before = rootState(editingExistingOpenAsset());

      const step = update(
        before,
        {
          type: "assetCreated",
          key: ROOT_KEY,
          assetId: "asset-123",
          sentAsset: makeUnsavedAsset(),
        },
        makeDeps()
      );

      expect(step.state).toBe(before);
      expect(step.effects).toEqual([
        { type: "notifyCreateDropped", assetId: "asset-123" },
      ]);
    });

    describe("a child's create fills in the parent's related item", () => {
      const relatedTemplate = makeTemplate(1, [
        { fieldTitle: "related_1", type: "related asset" },
      ]);
      const childDraft = makeUnsavedAsset({ assetId: null });
      const childDraftOpenAsset: EditingAsset = {
        ...editingNewOpenAsset({
          draft: childDraft,
          template: relatedTemplate,
        }),
        parentLink: childLink,
      };

      it("onto a parent draft's document, and notifies nothing for the child", () => {
        const parent = editingNewOpenAsset({
          draft: makeUnsavedAsset({
            related_1: [
              { targetAssetId: null, uuid: "item-1" },
              { targetAssetId: "asset-other", uuid: "item-2" },
            ],
          }),
          template: relatedTemplate,
        });
        const before = withChildOpenAsset(
          rootState(parent),
          childDraftOpenAsset
        );

        const step = update(
          before,
          {
            type: "assetCreated",
            key: CHILD_KEY,
            assetId: "asset-new",
            sentAsset: childDraft,
          },
          makeDeps()
        );

        expect(step.effects).toBeUndefined();
        const parentDraft = localAssetOf(step.state, ROOT_KEY);
        expect(parentDraft.related_1).toEqual([
          { targetAssetId: "asset-new", uuid: "item-1" },
          { targetAssetId: "asset-other", uuid: "item-2" },
        ]);
      });

      it("onto a parent's pending edits", () => {
        const parent = editingExistingOpenAsset({
          edits: { related_1: [{ targetAssetId: null, uuid: "item-1" }] },
        });
        const before = withChildOpenAsset(
          rootState(parent),
          childDraftOpenAsset
        );

        const state = reduce(before, {
          type: "assetCreated",
          key: CHILD_KEY,
          assetId: "asset-new",
          sentAsset: childDraft,
        });

        const openAsset = selectOpenAsset(state, ROOT_KEY);
        assertStatus(openAsset, "editingExistingAsset");
        expect(openAsset.edits.related_1).toEqual([
          { targetAssetId: "asset-new", uuid: "item-1" },
        ]);
      });

      it("leaves the parent alone when the item is gone", () => {
        // the user deleted the related item while the child's create was in
        // flight. The child still committed, and only the link has no home.
        const parent = editingExistingOpenAsset({ edits: { related_1: [] } });
        const before = withChildOpenAsset(
          rootState(parent),
          childDraftOpenAsset
        );

        const state = reduce(before, {
          type: "assetCreated",
          key: CHILD_KEY,
          assetId: "asset-new",
          sentAsset: childDraft,
        });

        const openAsset = selectOpenAsset(state, ROOT_KEY);
        assertStatus(openAsset, "editingExistingAsset");
        expect(openAsset.edits.related_1).toEqual([]);
        assertStatus(selectOpenAsset(state, CHILD_KEY), "editingExistingAsset");
      });

      it("still commits the child when the parent has closed", () => {
        const before: EditorState = {
          assets: { [CHILD_KEY]: childDraftOpenAsset },
          rootKey: null,
        };

        const state = reduce(before, {
          type: "assetCreated",
          key: CHILD_KEY,
          assetId: "asset-new",
          sentAsset: childDraft,
        });

        assertStatus(selectOpenAsset(state, CHILD_KEY), "editingExistingAsset");
      });
    });
  });

  describe("a save the server accepted", () => {
    it("retires the regenerate requests the save carried", () => {
      const uploadTemplate = makeTemplate(1, [{ type: "upload" }]);
      const savedAsset = makeSavedAsset({
        field_1: [{ fileId: "file-1", uuid: "row-1" }],
      });
      // regenerate is client-only and never comes back from the server, so
      // a save that carried it must not leave it reading as unsaved work
      const edits = {
        field_1: [{ fileId: "file-1", regenerate: true, uuid: "row-1" }],
      };

      const state = reduce(
        rootState(
          editingExistingOpenAsset({
            savedAsset,
            edits,
            template: uploadTemplate,
          })
        ),
        {
          type: "saveAccepted",
          key: ROOT_KEY,
          sentAsset: { ...savedAsset, ...edits },
        }
      );

      const openAsset = selectOpenAsset(state, ROOT_KEY);
      assertStatus(openAsset, "editingExistingAsset");
      expect(openAsset.edits.field_1).toBeUndefined();
      expect(selectHasUnsavedEdits(state, ROOT_KEY)).toBe(false);
    });

    it("drops an acceptance for an asset that has closed", () => {
      const uploadTemplate = makeTemplate(1, [{ type: "upload" }]);
      const before = rootState(
        editingExistingOpenAsset({
          edits: {
            field_1: [{ fileId: "file-1", regenerate: true, uuid: "row-1" }],
          },
          template: uploadTemplate,
        })
      );

      const state = reduce(before, {
        type: "saveAccepted",
        key: UNKNOWN_KEY,
        sentAsset: makeSavedAsset(),
      });

      expect(state).toBe(before);
    });
  });

  describe("save state", () => {
    it("saveStarted marks the asset pending", () => {
      const state = reduce(rootState(editingExistingOpenAsset()), {
        type: "saveStarted",
        key: ROOT_KEY,
      });

      const openAsset = selectOpenAsset(state, ROOT_KEY);
      assertStatus(openAsset, "editingExistingAsset");
      expect(openAsset.saveState).toBe("pending");
    });

    it("saveFailed marks the asset errored", () => {
      const state = reduce(rootState(editingExistingOpenAsset()), {
        type: "saveFailed",
        key: ROOT_KEY,
      });

      const openAsset = selectOpenAsset(state, ROOT_KEY);
      assertStatus(openAsset, "editingExistingAsset");
      expect(openAsset.saveState).toBe("error");
    });

    it("saveAccepted marks the asset successful", () => {
      const state = reduce(rootState(editingExistingOpenAsset()), {
        type: "saveAccepted",
        key: ROOT_KEY,
        sentAsset: makeSavedAsset(),
      });

      const openAsset = selectOpenAsset(state, ROOT_KEY);
      assertStatus(openAsset, "editingExistingAsset");
      expect(openAsset.saveState).toBe("success");
    });

    it("saveAccepted settles the edits it sent, without waiting for the read-back", () => {
      // the read-back is two more round trips, so an update that stayed
      // dirty until it landed left the leave guard nagging about work the
      // server already has
      const template = makeTemplate(1, [{}]);
      const savedAsset = makeSavedAsset({
        field_1: [{ fieldContents: "Title", isPrimary: false, uuid: "row-1" }],
      });
      const edits = {
        field_1: [
          { fieldContents: "Title edited", isPrimary: false, uuid: "row-1" },
        ],
      };

      const state = reduce(
        rootState(editingExistingOpenAsset({ savedAsset, edits, template })),
        {
          type: "saveAccepted",
          key: ROOT_KEY,
          sentAsset: { ...savedAsset, ...edits },
        }
      );

      expect(selectHasUnsavedEdits(state, ROOT_KEY)).toBe(false);
      // and the form still shows what was saved, rather than reverting to
      // the document the read-back has not replaced yet
      expect(selectLocalAsset(state, ROOT_KEY)?.field_1).toEqual(edits.field_1);
    });

    it("saveAccepted keeps an edit typed after the save was built", () => {
      const template = makeTemplate(1, [{}]);
      const savedAsset = makeSavedAsset({
        field_1: [{ fieldContents: "Title", isPrimary: false, uuid: "row-1" }],
      });
      const sentAsset = {
        ...savedAsset,
        field_1: [
          { fieldContents: "Title edited", isPrimary: false, uuid: "row-1" },
        ],
      };
      // typed while the save was in flight, so it is not in what was sent
      const edits = {
        field_1: [
          {
            fieldContents: "Title edited twice",
            isPrimary: false,
            uuid: "row-1",
          },
        ],
      };

      const state = reduce(
        rootState(editingExistingOpenAsset({ savedAsset, edits, template })),
        { type: "saveAccepted", key: ROOT_KEY, sentAsset }
      );

      expect(selectHasUnsavedEdits(state, ROOT_KEY)).toBe(true);
      expect(selectLocalAsset(state, ROOT_KEY)?.field_1).toEqual(edits.field_1);
    });

    it("saveStarted for an unknown key changes nothing", () => {
      const before = rootState(editingExistingOpenAsset());

      const state = reduce(before, { type: "saveStarted", key: UNKNOWN_KEY });

      expect(state).toBe(before);
    });
  });

  describe("migrating templates", () => {
    it("migrates a draft onto the new template", () => {
      const deps = makeDeps();
      const requested = update(
        rootState(
          editingNewOpenAsset({
            draft: makeUnsavedAsset({
              field_1: [{ fieldContents: "kept" }],
            }),
          })
        ),
        { type: "templateMigrationRequested", key: ROOT_KEY, templateId: 2 },
        deps
      );
      expect(requested.effects).toEqual([
        { type: "fetchTemplate", key: ROOT_KEY, templateId: 2 },
      ]);

      const state = update(
        requested.state,
        {
          type: "templateArrived",
          key: ROOT_KEY,
          templateId: 2,
          template: otherTemplate,
        },
        deps
      ).state;

      const openAsset = selectOpenAsset(state, ROOT_KEY);
      assertStatus(openAsset, "editingNewAsset");
      expect(openAsset.draft.templateId).toBe(2);
      expect(openAsset.draft.field_1).toEqual([{ fieldContents: "kept" }]);
      expect(openAsset.pendingTemplateId).toBeNull();
    });

    it("records a migration as edits against the untouched saved asset", () => {
      const savedAsset = makeSavedAsset({ templateId: 1 });
      let state = reduce(
        rootState(
          editingExistingOpenAsset({ savedAsset, template: emptyTemplate })
        ),
        { type: "templateMigrationRequested", key: ROOT_KEY, templateId: 2 }
      );

      state = reduce(state, {
        type: "templateArrived",
        key: ROOT_KEY,
        templateId: 2,
        template: otherTemplate,
      });

      const openAsset = selectOpenAsset(state, ROOT_KEY);
      assertStatus(openAsset, "editingExistingAsset");
      expect(openAsset.edits.templateId).toBe(2);
      expect(localAssetOf(state, ROOT_KEY).templateId).toBe(2);
    });

    it("leaves the asset editable on its current template when the migration fails", () => {
      let state = reduce(rootState(editingExistingOpenAsset()), {
        type: "templateMigrationRequested",
        key: ROOT_KEY,
        templateId: 2,
      });

      state = reduce(state, {
        type: "templateLoadFailed",
        key: ROOT_KEY,
        templateId: 2,
        error: new Error("migration failed"),
      });

      const openAsset = selectOpenAsset(state, ROOT_KEY);
      assertStatus(openAsset, "editingExistingAsset");
      expect(openAsset.edits).toEqual({});
      expect(openAsset.pendingTemplateId).toBeNull();
    });

    it("keeps the second template the user picked, whichever request resolves last", () => {
      const savedAsset = makeSavedAsset({ templateId: 1 });
      let state = reduce(
        rootState(
          editingExistingOpenAsset({ savedAsset, template: emptyTemplate })
        ),
        { type: "templateMigrationRequested", key: ROOT_KEY, templateId: 2 }
      );
      state = reduce(state, {
        type: "templateMigrationRequested",
        key: ROOT_KEY,
        templateId: 3,
      });

      // template 2 resolves late: the user has moved on to template 3
      state = reduce(state, {
        type: "templateArrived",
        key: ROOT_KEY,
        templateId: 2,
        template: otherTemplate,
      });
      let openAsset = selectOpenAsset(state, ROOT_KEY);
      assertStatus(openAsset, "editingExistingAsset");
      expect(openAsset.edits.templateId).toBeUndefined();

      state = reduce(state, {
        type: "templateArrived",
        key: ROOT_KEY,
        templateId: 3,
        template: makeTemplate(3),
      });
      openAsset = selectOpenAsset(state, ROOT_KEY);
      assertStatus(openAsset, "editingExistingAsset");
      expect(openAsset.edits.templateId).toBe(3);
    });

    it("drops a migration that was never requested", () => {
      const before = rootState(editingExistingOpenAsset());

      const state = reduce(before, {
        type: "templateArrived",
        key: ROOT_KEY,
        templateId: 2,
        template: otherTemplate,
      });

      expect(state).toBe(before);
    });
  });

  describe("walking an open asset's descendants", () => {
    it("collects the open asset and everything mounted under it", () => {
      const grandchildLink: ParentLink = {
        key: CHILD_KEY,
        fieldTitle: "related_1",
        itemUuid: "item-9",
      };
      const state: EditorState = {
        assets: {
          [ROOT_KEY]: editingExistingOpenAsset(),
          [CHILD_KEY]: { ...editingNewOpenAsset(), parentLink: childLink },
          "session-grandchild": {
            ...editingNewOpenAsset(),
            parentLink: grandchildLink,
          },
        },
        rootKey: ROOT_KEY,
      };

      expect(selectKeyAndDescendants(state, ROOT_KEY).sort()).toEqual([
        CHILD_KEY,
        "session-grandchild",
        ROOT_KEY,
      ]);
      expect(selectKeyAndDescendants(state, CHILD_KEY).sort()).toEqual([
        CHILD_KEY,
        "session-grandchild",
      ]);
    });

    it("terminates when open assets link in a cycle", () => {
      // asset A relating to B relating back to A, both open inline
      const state: EditorState = {
        assets: {
          "session-a": {
            ...editingExistingOpenAsset({ assetId: "asset-a" }),
            parentLink: {
              key: "session-b",
              fieldTitle: "related_1",
              itemUuid: "item-a",
            },
          },
          "session-b": {
            ...editingExistingOpenAsset({ assetId: "asset-b" }),
            parentLink: {
              key: "session-a",
              fieldTitle: "related_1",
              itemUuid: "item-b",
            },
          },
        },
        rootKey: null,
      };

      expect(selectKeyAndDescendants(state, "session-a").sort()).toEqual([
        "session-a",
        "session-b",
      ]);
    });
  });

  describe("naming the asset and template an open asset needs", () => {
    it("names no asset while the session holds none", () => {
      expect(selectAssetId(initialEditorState, ROOT_KEY)).toBeNull();
      expect(
        selectAssetId(rootState(editingNewOpenAsset()), ROOT_KEY)
      ).toBeNull();
    });

    it("names the asset being edited", () => {
      expect(
        selectAssetId(rootState(editingExistingOpenAsset()), ROOT_KEY)
      ).toBe("asset-123");
    });

    it("names the requested template while the draft awaits it", () => {
      expect(
        selectTemplateId(rootState(awaitingTemplateOpenAsset), ROOT_KEY)
      ).toBe(1);
    });

    it("names the draft's template", () => {
      expect(selectTemplateId(rootState(editingNewOpenAsset()), ROOT_KEY)).toBe(
        1
      );
    });

    it("names the snapshotted template for an existing asset", () => {
      const template = makeTemplate(7);
      expect(
        selectTemplateId(
          rootState(editingExistingOpenAsset({ template })),
          ROOT_KEY
        )
      ).toBe(7);
    });

    it("names nothing while the existing asset's template has not arrived", () => {
      expect(
        selectTemplateId(rootState(editingExistingOpenAsset()), ROOT_KEY)
      ).toBeNull();
    });
  });

  describe("the asset on screen", () => {
    it("lays pending edits over the saved asset", () => {
      const savedAsset = makeSavedAsset({ readyForDisplay: true });
      const state = rootState(
        editingExistingOpenAsset({
          edits: { readyForDisplay: false },
          savedAsset,
        })
      );

      const onScreen = localAssetOf(state, ROOT_KEY);

      expect(onScreen.readyForDisplay).toBe(false);
      expect(onScreen.assetId).toBe("asset-123");
    });

    it("shows nothing until the saved asset has arrived", () => {
      expect(
        selectLocalAsset(rootState(editingExistingOpenAsset()), ROOT_KEY)
      ).toBeNull();
    });

    it("shows the draft without needing any saved asset", () => {
      const draft = makeUnsavedAsset();
      expect(
        selectLocalAsset(rootState(editingNewOpenAsset({ draft })), ROOT_KEY)
      ).toBe(draft);
    });
  });

  describe("what counts as unsaved work", () => {
    const template = makeTemplate(1, [{}]);

    const draftState = (): EditorState =>
      reduce(
        rootState({
          status: "awaitingTemplate",
          parentLink: null,
          collectionId: 1,
          templateId: 1,
        }),
        {
          type: "templateArrived",
          key: ROOT_KEY,
          templateId: 1,
          template,
        }
      );

    it("reads an untouched draft as clean, so the leave guard stays quiet", () => {
      expect(selectHasUnsavedEdits(draftState(), ROOT_KEY)).toBe(false);
    });

    it("reads a draft the user typed into as unsaved work", () => {
      const state = reduce(draftState(), {
        type: "widgetContentsEdited",
        key: ROOT_KEY,
        fieldTitle: "field_1",
        contents: [{ fieldContents: "typed" }],
      });

      expect(selectHasUnsavedEdits(state, ROOT_KEY)).toBe(true);
    });

    it("reads an edit the server would store as unsaved work", () => {
      const savedAsset = makeSavedAsset({
        field_1: [{ fieldContents: "saved", uuid: "row-1" }],
      });
      const state = reduce(
        rootState(editingExistingOpenAsset({ savedAsset, template })),
        {
          type: "widgetContentsEdited",
          key: ROOT_KEY,
          fieldTitle: "field_1",
          contents: [{ fieldContents: "changed", uuid: "row-1" }],
        }
      );

      expect(selectHasUnsavedEdits(state, ROOT_KEY)).toBe(true);
    });

    it("reads an edit set back to the saved value as clean", () => {
      const savedAsset = makeSavedAsset({
        field_1: [{ fieldContents: "saved", uuid: "row-1" }],
      });
      let state = reduce(
        rootState(editingExistingOpenAsset({ savedAsset, template })),
        {
          type: "widgetContentsEdited",
          key: ROOT_KEY,
          fieldTitle: "field_1",
          contents: [{ fieldContents: "changed", uuid: "row-1" }],
        }
      );
      state = reduce(state, {
        type: "widgetContentsEdited",
        key: ROOT_KEY,
        fieldTitle: "field_1",
        contents: [{ fieldContents: "saved", uuid: "row-1" }],
      });

      expect(selectHasUnsavedEdits(state, ROOT_KEY)).toBe(false);
    });

    it("reads as clean while the saved asset has not arrived", () => {
      const state = rootState(
        editingExistingOpenAsset({ edits: { readyForDisplay: false } })
      );
      expect(selectHasUnsavedEdits(state, ROOT_KEY)).toBe(false);
    });
  });

  it("starts with nothing open", () => {
    expect(initialEditorState).toEqual({ assets: {}, rootKey: null });
  });
});
