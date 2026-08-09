import { describe, it, expect } from "vitest";
import {
  editorReducer,
  initialEditorModel,
  selectAssetId,
  selectHasUnsavedEdits,
  selectLocalAsset,
  selectSession,
  selectSessionAndDescendantKeys,
  selectTemplateId,
  type EditorEvent,
  type EditorModel,
  type EditSession,
  type ParentLink,
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

const ROOT_KEY = "session-root";
const CHILD_KEY = "session-child";

/** the key of a session that was closed or never opened */
const UNKNOWN_KEY = "session-unknown";

const awaitingTemplateSession: EditSession = {
  status: "awaitingTemplate",
  parentLink: null,
  collectionId: 42,
  templateId: 1,
};

const editingNewSession = (
  localAsset: UnsavedAsset = makeUnsavedAsset()
): EditSession => ({
  status: "editingNewAsset",
  parentLink: null,
  localAsset,
  pendingTemplateId: null,
});

const editingExistingSession = (
  edits: Partial<Asset> = {},
  assetId = "asset-123"
): EditSession => ({
  status: "editingExistingAsset",
  parentLink: null,
  assetId,
  edits,
  pendingTemplateId: null,
});

const rootModel = (session: EditSession): EditorModel => ({
  sessions: { [ROOT_KEY]: session },
  rootSessionKey: ROOT_KEY,
});

/** a child session mounted under the root's related_1 item "item-1" */
const childLink: ParentLink = {
  sessionKey: ROOT_KEY,
  fieldTitle: "related_1",
  itemUuid: "item-1",
};

const withChildSession = (
  model: EditorModel,
  session: EditSession
): EditorModel => ({
  ...model,
  sessions: { ...model.sessions, [CHILD_KEY]: session },
});

/** Narrows a session, failing the test when its status is not the one named. */
function assertStatus<TStatus extends EditSession["status"]>(
  session: EditSession | null,
  status: TStatus
): asserts session is Extract<EditSession, { status: TStatus }> {
  expect(session?.status).toBe(status);
}

/** throws rather than returning null, so tests read without a guard */
const localAssetOf = (
  model: EditorModel,
  sessionKey: string,
  baseline: Asset | null = null
): Asset | UnsavedAsset => {
  const asset = selectLocalAsset(model, sessionKey, baseline);
  if (!asset) throw new Error("expected an asset");
  return asset;
};

describe("editorReducer", () => {
  describe("opening and closing sessions", () => {
    it("opens a root session awaiting its template", () => {
      const model = reduce(initialEditorModel, {
        type: "newAssetRequested",
        sessionKey: ROOT_KEY,
        parentLink: null,
        collectionId: 42,
        templateId: 1,
      });

      expect(model.rootSessionKey).toBe(ROOT_KEY);
      assertStatus(selectSession(model, ROOT_KEY), "awaitingTemplate");
    });

    it("replaces the previous root session when a new root opens", () => {
      // the page reuses one editor across route changes, so nothing unmounts
      // to close the old root: opening the next root retires it
      const model = reduce(rootModel(editingExistingSession()), {
        type: "existingAssetRequested",
        sessionKey: "session-root-2",
        parentLink: null,
        assetId: "asset-456",
      });

      expect(model.rootSessionKey).toBe("session-root-2");
      expect(selectSession(model, ROOT_KEY)).toBeNull();
      assertStatus(
        selectSession(model, "session-root-2"),
        "editingExistingAsset"
      );
    });

    it("keeps the root in place when a child session opens", () => {
      const model = reduce(rootModel(editingExistingSession()), {
        type: "existingAssetRequested",
        sessionKey: CHILD_KEY,
        parentLink: childLink,
        assetId: "asset-456",
      });

      expect(model.rootSessionKey).toBe(ROOT_KEY);
      expect(selectSession(model, ROOT_KEY)).not.toBeNull();
      expect(selectSession(model, CHILD_KEY)).not.toBeNull();
    });

    it("removes a closed session", () => {
      const model = reduce(
        withChildSession(rootModel(editingExistingSession()), {
          ...editingNewSession(),
          parentLink: childLink,
        }),
        { type: "sessionClosed", sessionKey: CHILD_KEY }
      );

      expect(selectSession(model, CHILD_KEY)).toBeNull();
      expect(model.rootSessionKey).toBe(ROOT_KEY);
    });

    it("clears the root key when the root session closes", () => {
      const model = reduce(rootModel(editingExistingSession()), {
        type: "sessionClosed",
        sessionKey: ROOT_KEY,
      });

      expect(model.rootSessionKey).toBeNull();
      expect(model.sessions).toEqual({});
    });

    it("empties out on reset", () => {
      const model = reduce(rootModel(editingExistingSession()), {
        type: "resetRequested",
      });

      expect(model).toEqual({ sessions: {}, rootSessionKey: null });
    });
  });

  describe("starting a new asset", () => {
    it("builds a fresh unsaved asset when the requested template's document arrives", () => {
      const model = reduce(rootModel(awaitingTemplateSession), {
        type: "templateDocumentLoaded",
        sessionKey: ROOT_KEY,
        templateId: 1,
        template: emptyTemplate,
      });

      const session = selectSession(model, ROOT_KEY);
      assertStatus(session, "editingNewAsset");
      expect(session.localAsset.assetId).toBeNull();
      expect(session.localAsset.collectionId).toBe(42);
      expect(session.localAsset.templateId).toBe(1);
    });

    it("scaffolds a field for every widget in the template", () => {
      const template = makeTemplate(1, [{}, {}]);

      const model = reduce(rootModel(awaitingTemplateSession), {
        type: "templateDocumentLoaded",
        sessionKey: ROOT_KEY,
        templateId: 1,
        template,
      });

      const draft = localAssetOf(model, ROOT_KEY);
      expect(draft.field_1).toEqual([expect.any(Object)]);
      expect(draft.field_2).toEqual([expect.any(Object)]);
    });

    it("keeps the error when the template fails to load", () => {
      const error = new Error("template load failed");

      const model = reduce(rootModel(awaitingTemplateSession), {
        type: "templateDocumentLoadFailed",
        sessionKey: ROOT_KEY,
        templateId: 1,
        error,
      });

      assertStatus(selectSession(model, ROOT_KEY), "loadFailed");
    });

    it("drops a document for a template the user has moved past", () => {
      const before = rootModel(awaitingTemplateSession);

      const model = reduce(before, {
        type: "templateDocumentLoaded",
        sessionKey: ROOT_KEY,
        templateId: 99,
        template: makeTemplate(99),
      });

      expect(model).toBe(before);
    });

    it("drops a template document once the session is editing", () => {
      const before = rootModel(editingNewSession());

      const model = reduce(before, {
        type: "templateDocumentLoaded",
        sessionKey: ROOT_KEY,
        templateId: 1,
        template: emptyTemplate,
      });

      expect(model).toBe(before);
    });

    it("drops a template document for a session that has closed", () => {
      const before = rootModel(awaitingTemplateSession);

      const model = reduce(before, {
        type: "templateDocumentLoaded",
        sessionKey: UNKNOWN_KEY,
        templateId: 1,
        template: emptyTemplate,
      });

      expect(model).toBe(before);
    });

    it("keeps the newest template request rather than the first to resolve", () => {
      // the user picks template 1, then re-picks template 2 before 1 arrives.
      // Each request rewrites the same root session.
      let model = reduce(initialEditorModel, {
        type: "newAssetRequested",
        sessionKey: ROOT_KEY,
        parentLink: null,
        collectionId: 42,
        templateId: 1,
      });
      model = reduce(model, {
        type: "newAssetRequested",
        sessionKey: "session-root-2",
        parentLink: null,
        collectionId: 42,
        templateId: 2,
      });

      // template 1 resolves late, addressed to the retired session
      model = reduce(model, {
        type: "templateDocumentLoaded",
        sessionKey: ROOT_KEY,
        templateId: 1,
        template: emptyTemplate,
      });
      expect(selectSession(model, ROOT_KEY)).toBeNull();

      model = reduce(model, {
        type: "templateDocumentLoaded",
        sessionKey: "session-root-2",
        templateId: 2,
        template: otherTemplate,
      });
      const session = selectSession(model, "session-root-2");
      assertStatus(session, "editingNewAsset");
      expect(session.localAsset.templateId).toBe(2);
    });
  });

  describe("opening an existing asset", () => {
    it("holds only the asset's identity, no document", () => {
      const model = reduce(initialEditorModel, {
        type: "existingAssetRequested",
        sessionKey: ROOT_KEY,
        parentLink: null,
        assetId: "asset-123",
      });

      const session = selectSession(model, ROOT_KEY);
      assertStatus(session, "editingExistingAsset");
      expect(session.assetId).toBe("asset-123");
      expect(session.edits).toEqual({});
    });

    it("records a failure to load the session's asset", () => {
      const error = new Error("load failed");

      const model = reduce(rootModel(editingExistingSession()), {
        type: "assetLoadFailed",
        sessionKey: ROOT_KEY,
        error,
      });

      assertStatus(selectSession(model, ROOT_KEY), "loadFailed");
    });

    it("drops a load failure for a session that has closed", () => {
      const before = rootModel(editingExistingSession());

      const model = reduce(before, {
        type: "assetLoadFailed",
        sessionKey: UNKNOWN_KEY,
        error: new Error("too late"),
      });

      expect(model).toBe(before);
    });
  });

  describe("the rebase: baselineRefreshed", () => {
    const refreshed = (
      baseline: Asset,
      template: Template = emptyTemplate,
      sessionKey = ROOT_KEY
    ): EditorEvent => ({
      type: "baselineRefreshed",
      sessionKey,
      baseline,
      template,
    });

    it("keeps an edit that still differs from the new baseline", () => {
      const model = reduce(
        rootModel(editingExistingSession({ readyForDisplay: false })),
        refreshed(makeSavedAsset({ readyForDisplay: true }))
      );

      const session = selectSession(model, ROOT_KEY);
      assertStatus(session, "editingExistingAsset");
      expect(session.edits).toEqual({ readyForDisplay: false });
    });

    it("drops an edit the new baseline made redundant", () => {
      const model = reduce(
        rootModel(editingExistingSession({ readyForDisplay: false })),
        refreshed(makeSavedAsset({ readyForDisplay: false }))
      );

      const session = selectSession(model, ROOT_KEY);
      assertStatus(session, "editingExistingAsset");
      expect(session.edits).toEqual({});
    });

    it("lets a refreshed baseline show through fields the user never touched", () => {
      const baseline = makeSavedAsset({
        readyForDisplay: true,
        field_1: [{ fieldContents: "someone else's edit", uuid: "theirs" }],
      });

      const model = reduce(
        rootModel(editingExistingSession({ readyForDisplay: false })),
        refreshed(baseline, makeTemplate(1, [{}]))
      );

      const onScreen = localAssetOf(model, ROOT_KEY, baseline);
      expect(onScreen.field_1).toEqual([
        { fieldContents: "someone else's edit", uuid: "theirs" },
      ]);
      expect(onScreen.readyForDisplay).toBe(false);
    });

    it("drops an edit whose only difference is content uuids", () => {
      const template = makeTemplate(1, [{}]);
      const model = reduce(
        rootModel(
          editingExistingSession({
            field_1: [
              { fieldContents: "same", isPrimary: false, uuid: "mine" },
            ],
          })
        ),
        refreshed(
          makeSavedAsset({
            field_1: [
              { fieldContents: "same", isPrimary: false, uuid: "stored" },
            ],
          }),
          template
        )
      );

      const session = selectSession(model, ROOT_KEY);
      assertStatus(session, "editingExistingAsset");
      expect(session.edits).toEqual({});
    });

    it("keeps an unsaved template migration across a refresh", () => {
      const model = reduce(
        rootModel(editingExistingSession({ templateId: 2 })),
        refreshed(makeSavedAsset({ templateId: 1 }), otherTemplate)
      );

      const session = selectSession(model, ROOT_KEY);
      assertStatus(session, "editingExistingAsset");
      expect(session.edits.templateId).toBe(2);
    });

    it("drops a baseline for an asset the session does not hold", () => {
      const before = rootModel(editingExistingSession({}, "asset-456"));

      const model = reduce(
        before,
        refreshed(makeSavedAsset({ assetId: "asset-123" }))
      );

      expect(model).toBe(before);
    });

    it("drops a baseline for a session that has closed", () => {
      const before = rootModel(editingExistingSession());

      const model = reduce(
        before,
        refreshed(makeSavedAsset(), emptyTemplate, UNKNOWN_KEY)
      );

      expect(model).toBe(before);
    });

    it("leaves other sessions alone", () => {
      const childSession: EditSession = {
        ...editingExistingSession({ readyForDisplay: false }, "asset-456"),
        parentLink: childLink,
      };
      const before = withChildSession(
        rootModel(editingExistingSession()),
        childSession
      );

      const model = reduce(before, refreshed(makeSavedAsset()));

      expect(selectSession(model, CHILD_KEY)).toBe(childSession);
    });
  });

  describe("editing", () => {
    it("keeps the assetId null while the user types, so the first save is still a create", () => {
      const model = reduce(rootModel(editingNewSession()), {
        type: "widgetContentsEdited",
        sessionKey: ROOT_KEY,
        fieldTitle: "field_1",
        contents: [{ fieldContents: "typed" }],
      });

      expect(localAssetOf(model, ROOT_KEY).assetId).toBeNull();
      expect(localAssetOf(model, ROOT_KEY).field_1).toEqual([
        { fieldContents: "typed" },
      ]);
    });

    it("records a widget edit without touching the baseline", () => {
      const baseline = makeSavedAsset();

      const model = reduce(rootModel(editingExistingSession()), {
        type: "widgetContentsEdited",
        sessionKey: ROOT_KEY,
        fieldTitle: "field_1",
        contents: [{ fieldContents: "typed" }],
      });

      const session = selectSession(model, ROOT_KEY);
      assertStatus(session, "editingExistingAsset");
      expect(session.edits).toEqual({
        field_1: [{ fieldContents: "typed" }],
      });
      expect(localAssetOf(model, ROOT_KEY, baseline).field_1).toEqual([
        { fieldContents: "typed" },
      ]);
    });

    it("drops an edit for a session that has closed", () => {
      const before = rootModel(editingExistingSession());

      const model = reduce(before, {
        type: "widgetContentsEdited",
        sessionKey: UNKNOWN_KEY,
        fieldTitle: "field_1",
        contents: [{ fieldContents: "typed" }],
      });

      expect(model).toBe(before);
    });

    it("updates the collection on the asset", () => {
      const model = reduce(rootModel(editingExistingSession()), {
        type: "collectionChanged",
        sessionKey: ROOT_KEY,
        collectionId: 9,
      });

      const session = selectSession(model, ROOT_KEY);
      assertStatus(session, "editingExistingAsset");
      expect(session.edits.collectionId).toBe(9);
    });

    it("updates readyForDisplay on the asset", () => {
      const model = reduce(rootModel(editingExistingSession()), {
        type: "readyForDisplayChanged",
        sessionKey: ROOT_KEY,
        readyForDisplay: false,
      });

      const session = selectSession(model, ROOT_KEY);
      assertStatus(session, "editingExistingAsset");
      expect(session.edits.readyForDisplay).toBe(false);
    });

    it("updates availableAfter on the asset", () => {
      const model = reduce(rootModel(editingExistingSession()), {
        type: "availableAfterChanged",
        sessionKey: ROOT_KEY,
        availableAfter: savedDate,
      });

      const session = selectSession(model, ROOT_KEY);
      assertStatus(session, "editingExistingAsset");
      expect(session.edits.availableAfter).toBe(savedDate);
    });
  });

  describe("a completed upload", () => {
    // no file may be orphaned: an appended upload item is followed by a
    // save request, always. The rule lives in this one arm instead of an
    // emit chain four components long.
    const uploadedContents = [{ fileId: "file-1", uuid: "item-1" }];

    it("writes the items and asks for a save in the same step", () => {
      const step = editorReducer(rootModel(editingExistingSession()), {
        type: "uploadCompleted",
        sessionKey: ROOT_KEY,
        fieldTitle: "upload_1",
        contents: uploadedContents,
      });

      const session = selectSession(step.model, ROOT_KEY);
      assertStatus(session, "editingExistingAsset");
      expect(session.edits.upload_1).toEqual(uploadedContents);
      expect(step.commands).toEqual([
        { type: "requestSave", sessionKey: ROOT_KEY },
      ]);
    });

    it("writes into a draft the same way", () => {
      const step = editorReducer(rootModel(editingNewSession()), {
        type: "uploadCompleted",
        sessionKey: ROOT_KEY,
        fieldTitle: "upload_1",
        contents: uploadedContents,
      });

      const session = selectSession(step.model, ROOT_KEY);
      assertStatus(session, "editingNewAsset");
      expect(session.localAsset.upload_1).toEqual(uploadedContents);
      expect(step.commands).toEqual([
        { type: "requestSave", sessionKey: ROOT_KEY },
      ]);
    });

    it("asks for nothing when the session has closed", () => {
      const before = rootModel(editingExistingSession());

      const step = editorReducer(before, {
        type: "uploadCompleted",
        sessionKey: UNKNOWN_KEY,
        fieldTitle: "upload_1",
        contents: uploadedContents,
      });

      expect(step.model).toBe(before);
      expect(step.commands).toBeUndefined();
    });
  });

  describe("committing a create before the read-back", () => {
    const createdEvent = (
      baseline: Asset,
      sessionKey = ROOT_KEY,
      template: Template = emptyTemplate
    ): EditorEvent => ({
      type: "assetCreated",
      sessionKey,
      baseline,
      template,
    });

    it("takes the new assetId and asks the page to link it", () => {
      const baseline = makeSavedAsset({ assetId: "asset-new" });

      const step = editorReducer(
        rootModel(editingNewSession()),
        createdEvent(baseline)
      );

      const session = selectSession(step.model, ROOT_KEY);
      assertStatus(session, "editingExistingAsset");
      expect(session.assetId).toBe("asset-new");
      expect(step.commands).toEqual([
        {
          type: "notifyAssetCreated",
          sessionKey: ROOT_KEY,
          assetId: "asset-new",
        },
      ]);
    });

    it("keeps edits typed while the create was in flight pending", () => {
      const template = makeTemplate(1, [{}]);
      const draft = makeUnsavedAsset({
        field_1: [{ fieldContents: "typed after send", uuid: "row-1" }],
      });
      const echoed = makeSavedAsset({
        assetId: "asset-new",
        field_1: [{ fieldContents: "as sent", uuid: "row-1" }],
      });

      const model = reduce(
        rootModel(editingNewSession(draft)),
        createdEvent(echoed, ROOT_KEY, template)
      );

      const session = selectSession(model, ROOT_KEY);
      assertStatus(session, "editingExistingAsset");
      expect(session.edits.field_1).toEqual([
        { fieldContents: "typed after send", uuid: "row-1" },
      ]);
    });

    it("drops a create response for a session that has closed, and says the asset is orphaned", () => {
      // abandoning a draft closes its session; the next draft opens a new
      // session under a fresh key, which this response does not carry. The
      // asset exists with nothing pointing at it, which the user must hear.
      const before = rootModel(editingNewSession());

      const step = editorReducer(
        before,
        createdEvent(makeSavedAsset({ assetId: "asset-orphan" }), UNKNOWN_KEY)
      );

      expect(step.model).toBe(before);
      expect(step.commands).toEqual([
        {
          type: "notifyCreateDropped",
          sessionKey: UNKNOWN_KEY,
          assetId: "asset-orphan",
        },
      ]);
    });

    it("drops a create response once the session holds an existing asset", () => {
      const before = rootModel(editingExistingSession());

      const step = editorReducer(before, createdEvent(makeSavedAsset()));

      expect(step.model).toBe(before);
      expect(step.commands).toEqual([
        {
          type: "notifyCreateDropped",
          sessionKey: ROOT_KEY,
          assetId: "asset-123",
        },
      ]);
    });

    describe("a child session's create stamps the parent's related item", () => {
      const relatedTemplate = makeTemplate(1, [
        { fieldTitle: "related_1", type: "related asset" },
      ]);
      const childDraftSession: EditSession = {
        ...editingNewSession(makeUnsavedAsset({ assetId: null })),
        parentLink: childLink,
      };

      it("onto a parent draft's document", () => {
        const parent = editingNewSession(
          makeUnsavedAsset({
            related_1: [
              { targetAssetId: null, uuid: "item-1" },
              { targetAssetId: "asset-other", uuid: "item-2" },
            ],
          })
        );
        const before = withChildSession(rootModel(parent), childDraftSession);

        const model = reduce(
          before,
          createdEvent(
            makeSavedAsset({ assetId: "asset-new" }),
            CHILD_KEY,
            relatedTemplate
          )
        );

        const parentDraft = localAssetOf(model, ROOT_KEY);
        expect(parentDraft.related_1).toEqual([
          { targetAssetId: "asset-new", uuid: "item-1" },
          { targetAssetId: "asset-other", uuid: "item-2" },
        ]);
      });

      it("onto a parent's pending edits", () => {
        const parent = editingExistingSession({
          related_1: [{ targetAssetId: null, uuid: "item-1" }],
        });
        const before = withChildSession(rootModel(parent), childDraftSession);

        const model = reduce(
          before,
          createdEvent(
            makeSavedAsset({ assetId: "asset-new" }),
            CHILD_KEY,
            relatedTemplate
          )
        );

        const session = selectSession(model, ROOT_KEY);
        assertStatus(session, "editingExistingAsset");
        expect(session.edits.related_1).toEqual([
          { targetAssetId: "asset-new", uuid: "item-1" },
        ]);
      });

      it("leaves the parent alone when the item is gone", () => {
        // the user deleted the related item while the child's create was in
        // flight. The child still committed; only the link has no home.
        const parent = editingExistingSession({ related_1: [] });
        const before = withChildSession(rootModel(parent), childDraftSession);

        const model = reduce(
          before,
          createdEvent(makeSavedAsset(), CHILD_KEY, relatedTemplate)
        );

        const session = selectSession(model, ROOT_KEY);
        assertStatus(session, "editingExistingAsset");
        expect(session.edits.related_1).toEqual([]);
        assertStatus(selectSession(model, CHILD_KEY), "editingExistingAsset");
      });

      it("still commits the child when the parent session has closed", () => {
        const before: EditorModel = {
          sessions: { [CHILD_KEY]: childDraftSession },
          rootSessionKey: null,
        };

        const model = reduce(
          before,
          createdEvent(makeSavedAsset(), CHILD_KEY, relatedTemplate)
        );

        assertStatus(selectSession(model, CHILD_KEY), "editingExistingAsset");
      });
    });
  });

  describe("a save the server accepted", () => {
    const uploadTemplate = makeTemplate(1, [{ type: "upload" }]);

    it("retires the regenerate requests the save carried", () => {
      const model = reduce(
        rootModel(
          editingExistingSession({
            field_1: [{ fileId: "file-1", regenerate: true, uuid: "row-1" }],
          })
        ),
        { type: "saveAccepted", sessionKey: ROOT_KEY, template: uploadTemplate }
      );

      const session = selectSession(model, ROOT_KEY);
      assertStatus(session, "editingExistingAsset");
      expect(session.edits.field_1).toEqual([
        { fileId: "file-1", uuid: "row-1" },
      ]);
    });

    it("drops an acceptance for a session that has closed", () => {
      const before = rootModel(
        editingExistingSession({
          field_1: [{ fileId: "file-1", regenerate: true, uuid: "row-1" }],
        })
      );

      const model = reduce(before, {
        type: "saveAccepted",
        sessionKey: UNKNOWN_KEY,
        template: uploadTemplate,
      });

      expect(model).toBe(before);
    });
  });

  describe("migrating templates", () => {
    it("migrates a draft onto the new template", () => {
      let model = reduce(
        rootModel(
          editingNewSession(
            makeUnsavedAsset({ field_1: [{ fieldContents: "kept" }] })
          )
        ),
        {
          type: "templateMigrationRequested",
          sessionKey: ROOT_KEY,
          templateId: 2,
        }
      );

      model = reduce(model, {
        type: "templateMigrated",
        sessionKey: ROOT_KEY,
        templateId: 2,
        template: otherTemplate,
        baseline: null,
      });

      const session = selectSession(model, ROOT_KEY);
      assertStatus(session, "editingNewAsset");
      expect(session.localAsset.templateId).toBe(2);
      expect(session.localAsset.field_1).toEqual([{ fieldContents: "kept" }]);
      expect(session.pendingTemplateId).toBeNull();
    });

    it("records a migration as edits against the untouched baseline", () => {
      const baseline = makeSavedAsset({ templateId: 1 });
      let model = reduce(rootModel(editingExistingSession()), {
        type: "templateMigrationRequested",
        sessionKey: ROOT_KEY,
        templateId: 2,
      });

      model = reduce(model, {
        type: "templateMigrated",
        sessionKey: ROOT_KEY,
        templateId: 2,
        template: otherTemplate,
        baseline,
      });

      const session = selectSession(model, ROOT_KEY);
      assertStatus(session, "editingExistingAsset");
      expect(session.edits.templateId).toBe(2);
      expect(localAssetOf(model, ROOT_KEY, baseline).templateId).toBe(2);
    });

    it("leaves the asset editable on its current template when the migration fails", () => {
      let model = reduce(rootModel(editingExistingSession()), {
        type: "templateMigrationRequested",
        sessionKey: ROOT_KEY,
        templateId: 2,
      });

      model = reduce(model, {
        type: "templateMigrationFailed",
        sessionKey: ROOT_KEY,
        templateId: 2,
        error: new Error("migration failed"),
      });

      const session = selectSession(model, ROOT_KEY);
      assertStatus(session, "editingExistingAsset");
      expect(session.edits).toEqual({});
      expect(session.pendingTemplateId).toBeNull();
    });

    it("keeps the second template the user picked, whichever request resolves last", () => {
      const baseline = makeSavedAsset({ templateId: 1 });
      let model = reduce(rootModel(editingExistingSession()), {
        type: "templateMigrationRequested",
        sessionKey: ROOT_KEY,
        templateId: 2,
      });
      model = reduce(model, {
        type: "templateMigrationRequested",
        sessionKey: ROOT_KEY,
        templateId: 3,
      });

      // template 2 resolves late: the user has moved on to template 3
      model = reduce(model, {
        type: "templateMigrated",
        sessionKey: ROOT_KEY,
        templateId: 2,
        template: otherTemplate,
        baseline,
      });
      let session = selectSession(model, ROOT_KEY);
      assertStatus(session, "editingExistingAsset");
      expect(session.edits.templateId).toBeUndefined();

      model = reduce(model, {
        type: "templateMigrated",
        sessionKey: ROOT_KEY,
        templateId: 3,
        template: makeTemplate(3),
        baseline,
      });
      session = selectSession(model, ROOT_KEY);
      assertStatus(session, "editingExistingAsset");
      expect(session.edits.templateId).toBe(3);
    });

    it("drops a migration that was never requested", () => {
      const before = rootModel(editingExistingSession());

      const model = reduce(before, {
        type: "templateMigrated",
        sessionKey: ROOT_KEY,
        templateId: 2,
        template: otherTemplate,
        baseline: makeSavedAsset(),
      });

      expect(model).toBe(before);
    });
  });

  describe("walking a session's descendants", () => {
    it("collects the session and everything mounted under it", () => {
      const grandchildLink: ParentLink = {
        sessionKey: CHILD_KEY,
        fieldTitle: "related_1",
        itemUuid: "item-9",
      };
      const model: EditorModel = {
        sessions: {
          [ROOT_KEY]: editingExistingSession(),
          [CHILD_KEY]: { ...editingNewSession(), parentLink: childLink },
          "session-grandchild": {
            ...editingNewSession(),
            parentLink: grandchildLink,
          },
        },
        rootSessionKey: ROOT_KEY,
      };

      expect(selectSessionAndDescendantKeys(model, ROOT_KEY).sort()).toEqual([
        CHILD_KEY,
        "session-grandchild",
        ROOT_KEY,
      ]);
      expect(selectSessionAndDescendantKeys(model, CHILD_KEY).sort()).toEqual([
        CHILD_KEY,
        "session-grandchild",
      ]);
    });

    it("terminates when sessions link in a cycle", () => {
      // asset A relating to B relating back to A, both open inline
      const model: EditorModel = {
        sessions: {
          "session-a": {
            ...editingExistingSession({}, "asset-a"),
            parentLink: {
              sessionKey: "session-b",
              fieldTitle: "related_1",
              itemUuid: "item-a",
            },
          },
          "session-b": {
            ...editingExistingSession({}, "asset-b"),
            parentLink: {
              sessionKey: "session-a",
              fieldTitle: "related_1",
              itemUuid: "item-b",
            },
          },
        },
        rootSessionKey: null,
      };

      expect(selectSessionAndDescendantKeys(model, "session-a").sort()).toEqual(
        ["session-a", "session-b"]
      );
    });
  });

  describe("naming the asset and template a session needs", () => {
    it("names no asset while the session holds none", () => {
      expect(selectAssetId(initialEditorModel, ROOT_KEY)).toBeNull();
      expect(
        selectAssetId(rootModel(editingNewSession()), ROOT_KEY)
      ).toBeNull();
    });

    it("names the asset being edited", () => {
      expect(selectAssetId(rootModel(editingExistingSession()), ROOT_KEY)).toBe(
        "asset-123"
      );
    });

    it("names the requested template while the draft awaits its document", () => {
      expect(
        selectTemplateId(rootModel(awaitingTemplateSession), ROOT_KEY, null)
      ).toBe(1);
    });

    it("names the draft's template", () => {
      expect(
        selectTemplateId(rootModel(editingNewSession()), ROOT_KEY, null)
      ).toBe(1);
    });

    it("names the baseline's template for an untouched existing asset", () => {
      const baseline = makeSavedAsset({ templateId: 7 });
      expect(
        selectTemplateId(
          rootModel(editingExistingSession()),
          ROOT_KEY,
          baseline
        )
      ).toBe(7);
    });

    it("names the migrated template over the baseline's, so a pending migration wins", () => {
      const baseline = makeSavedAsset({ templateId: 1 });
      expect(
        selectTemplateId(
          rootModel(editingExistingSession({ templateId: 2 })),
          ROOT_KEY,
          baseline
        )
      ).toBe(2);
    });

    it("ignores a baseline for an asset the session does not hold", () => {
      const staleBaseline = makeSavedAsset({ assetId: "asset-old" });
      expect(
        selectTemplateId(
          rootModel(editingExistingSession()),
          ROOT_KEY,
          staleBaseline
        )
      ).toBeNull();
    });
  });

  describe("the asset on screen", () => {
    it("lays pending edits over the baseline", () => {
      const baseline = makeSavedAsset({ readyForDisplay: true });
      const model = rootModel(
        editingExistingSession({ readyForDisplay: false })
      );

      const onScreen = localAssetOf(model, ROOT_KEY, baseline);

      expect(onScreen.readyForDisplay).toBe(false);
      expect(onScreen.assetId).toBe("asset-123");
    });

    it("shows nothing until the baseline document has arrived", () => {
      expect(
        selectLocalAsset(rootModel(editingExistingSession()), ROOT_KEY, null)
      ).toBeNull();
    });

    it("shows nothing over a baseline for an asset the session does not hold", () => {
      const staleBaseline = makeSavedAsset({ assetId: "asset-old" });
      expect(
        selectLocalAsset(
          rootModel(editingExistingSession()),
          ROOT_KEY,
          staleBaseline
        )
      ).toBeNull();
    });

    it("shows the draft without needing any baseline", () => {
      const draft = makeUnsavedAsset();
      expect(
        selectLocalAsset(rootModel(editingNewSession(draft)), ROOT_KEY, null)
      ).toBe(draft);
    });
  });

  describe("what counts as unsaved work", () => {
    const template = makeTemplate(1, [{}]);

    const draftModel = (): EditorModel =>
      reduce(
        rootModel({
          status: "awaitingTemplate",
          parentLink: null,
          collectionId: 1,
          templateId: 1,
        }),
        {
          type: "templateDocumentLoaded",
          sessionKey: ROOT_KEY,
          templateId: 1,
          template,
        }
      );

    it("reads an untouched draft as clean, so the leave guard stays quiet", () => {
      expect(
        selectHasUnsavedEdits(draftModel(), ROOT_KEY, null, template)
      ).toBe(false);
    });

    it("reads a draft the user typed into as unsaved work", () => {
      const model = reduce(draftModel(), {
        type: "widgetContentsEdited",
        sessionKey: ROOT_KEY,
        fieldTitle: "field_1",
        contents: [{ fieldContents: "typed" }],
      });

      expect(selectHasUnsavedEdits(model, ROOT_KEY, null, template)).toBe(true);
    });

    it("reads an edit the server would store as unsaved work", () => {
      const baseline = makeSavedAsset({
        field_1: [{ fieldContents: "saved", uuid: "row-1" }],
      });
      const model = reduce(rootModel(editingExistingSession()), {
        type: "widgetContentsEdited",
        sessionKey: ROOT_KEY,
        fieldTitle: "field_1",
        contents: [{ fieldContents: "changed", uuid: "row-1" }],
      });

      expect(selectHasUnsavedEdits(model, ROOT_KEY, baseline, template)).toBe(
        true
      );
    });

    it("reads an edit set back to the saved value as clean", () => {
      const baseline = makeSavedAsset({
        field_1: [{ fieldContents: "saved", uuid: "row-1" }],
      });
      let model = reduce(rootModel(editingExistingSession()), {
        type: "widgetContentsEdited",
        sessionKey: ROOT_KEY,
        fieldTitle: "field_1",
        contents: [{ fieldContents: "changed", uuid: "row-1" }],
      });
      model = reduce(model, {
        type: "widgetContentsEdited",
        sessionKey: ROOT_KEY,
        fieldTitle: "field_1",
        contents: [{ fieldContents: "saved", uuid: "row-1" }],
      });

      expect(selectHasUnsavedEdits(model, ROOT_KEY, baseline, template)).toBe(
        false
      );
    });

    it("reads as clean while the baseline document has not arrived", () => {
      const model = rootModel(
        editingExistingSession({ readyForDisplay: false })
      );
      expect(selectHasUnsavedEdits(model, ROOT_KEY, null, template)).toBe(
        false
      );
    });

    it("reads as clean while the template document has not arrived, whatever the draft holds", () => {
      const model = reduce(draftModel(), {
        type: "widgetContentsEdited",
        sessionKey: ROOT_KEY,
        fieldTitle: "field_1",
        contents: [{ fieldContents: "typed" }],
      });

      expect(selectHasUnsavedEdits(model, ROOT_KEY, null, null)).toBe(false);
    });
  });

  it("starts with no sessions", () => {
    expect(initialEditorModel).toEqual({ sessions: {}, rootSessionKey: null });
  });
});
