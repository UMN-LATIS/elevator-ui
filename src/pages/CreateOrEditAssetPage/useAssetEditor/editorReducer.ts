import * as T from "@/types";
import {
  clearUploadRegenerationFlags,
  diffEditableFields,
  makeNewLocalAsset,
  migrateAssetToTemplate,
  wouldSaveChangeStoredAsset,
} from "./localAsset";

/**
 * The editor is always in exactly one of these states.
 *
 * The model holds no server documents. The asset baseline and the template
 * live in the query cache under the ids the model names, and the arms that
 * need a document receive it as event input, never store it. What the user
 * sees is the baseline with `edits` laid over it (`selectLocalAsset`).
 *
 * Late async results are dropped by checking identity, not a counter. Each
 * resolution event carries back the id of the thing it answers: the
 * templateId a template document answers, the assetId a baseline or a
 * failure is about, the draftKey a create response belongs to. A resolution
 * about something the editor no longer holds simply fails its comparison.
 */
export type EditorModel =
  | { status: "idle" }
  | { status: "assetLoadFailed"; error: Error }
  | {
      status: "awaitingTemplate";
      collectionId: number;
      /** the draft scaffolds when this template's document arrives */
      templateId: number;
    }
  | {
      status: "editingNewAsset";
      /**
       * The draft's identity. A draft has no assetId, so a create response
       * proves it belongs here by carrying this key back.
       */
      draftKey: string;
      /** the whole document: a draft has no server copy for the cache to own */
      localAsset: T.UnsavedAsset;
      /** the migration in flight, if any, so only its result may land */
      pendingTemplateId: number | null;
    }
  | {
      status: "editingExistingAsset";
      /** names the baseline: the cache slot this editor reads documents from */
      assetId: string;
      /**
       * Only the fields the user has changed since the baseline. Everything
       * else reads through, so a refreshed baseline shows through untouched
       * fields for free.
       */
      edits: Partial<T.Asset>;
      /** the migration in flight, if any, so only its result may land */
      pendingTemplateId: number | null;
    };

export const initialEditorModel: EditorModel = { status: "idle" };

/** The two statuses that hold an asset, for callers that accept either. */
export type EditingModel = Extract<
  EditorModel,
  { status: "editingNewAsset" | "editingExistingAsset" }
>;

/** The editor is holding an asset the user can edit. */
export function isEditingAsset(model: EditorModel): model is EditingModel {
  return (
    model.status === "editingNewAsset" ||
    model.status === "editingExistingAsset"
  );
}

/**
 * The asset baseline the editor needs, named by id. The document itself
 * lives in the query cache under this id.
 */
export function selectAssetId(model: EditorModel): string | null {
  return model.status === "editingExistingAsset" ? model.assetId : null;
}

/**
 * The asset as the user sees it: the baseline with pending edits laid over
 * it, or the draft itself. Null while the editor holds no asset, and null
 * until the baseline for the right asset has arrived: a baseline still
 * showing the previously open asset must not leak under the new one's edits.
 */
export function selectLocalAsset(
  model: EditorModel,
  baseline: T.Asset | null
): T.Asset | T.UnsavedAsset | null {
  switch (model.status) {
    case "editingNewAsset":
      return model.localAsset;
    case "editingExistingAsset":
      if (!baseline || baseline.assetId !== model.assetId) return null;
      return { ...baseline, ...model.edits };
    default:
      return null;
  }
}

/** The error that left the editor with nothing to edit. */
export function selectLoadError(model: EditorModel): Error | null {
  return model.status === "assetLoadFailed" ? model.error : null;
}

/**
 * The template the editor needs, named by id. The document itself lives in
 * the query cache under this id. For an existing asset the answer comes
 * from the baseline document, except while a migration is unsaved, where
 * the migrated id in `edits` wins.
 */
export function selectTemplateId(
  model: EditorModel,
  baseline: T.Asset | null
): number | null {
  switch (model.status) {
    case "awaitingTemplate":
      return model.templateId;
    case "editingNewAsset":
      return model.localAsset.templateId ?? null;
    case "editingExistingAsset": {
      if (typeof model.edits.templateId === "number") {
        return model.edits.templateId;
      }
      if (!baseline || baseline.assetId !== model.assetId) return null;
      return baseline.templateId ?? null;
    }
    default:
      return null;
  }
}

/**
 * Whether the editor holds work a save would send and leaving would lose.
 *
 * Takes the documents because dirtiness is measured in the shape the server
 * would store. While either document is missing there is no measure, so the
 * editor reads as clean.
 */
export function selectHasUnsavedEdits(
  model: EditorModel,
  baseline: T.Asset | null,
  template: T.Template | null
): boolean {
  if (!isEditingAsset(model) || !template) return false;
  switch (model.status) {
    case "editingNewAsset":
      // an untouched draft is not unsaved work, or the leave guard would
      // nag on a create page the user never typed into
      return wouldSaveChangeStoredAsset({
        draft: model.localAsset,
        savedAsset: makeNewLocalAsset({
          template,
          collectionId: model.localAsset.collectionId,
        }),
        template,
      });
    case "editingExistingAsset": {
      const onScreen = selectLocalAsset(model, baseline);
      if (!onScreen || !baseline) return false;
      // `edits` may hold differences the server would never store, like a
      // freshly added blank item, so dirtiness is measured against what a
      // save would actually change
      return wouldSaveChangeStoredAsset({
        draft: onScreen,
        savedAsset: baseline,
        template,
      });
    }
    default:
      return assertNever(model);
  }
}

/**
 * An effect the reducer asks the shell to run. Commands are data so the
 * decision to act stays in the reducer, where late resolutions are already
 * dropped: a command that is never emitted can never fire against an asset
 * the editor no longer holds.
 */
export type EditorCommand = {
  /** The server assigned this draft its id. Pages redirect or link on it. */
  type: "notifyAssetCreated";
  assetId: string;
};

/** One reducer step: the next model plus the effects it asks for. */
export interface EditorStep {
  model: EditorModel;
  /** Run by the shell after the model is committed. Most events need none. */
  commands?: EditorCommand[];
}

/** Everything that can change the model. */
export type EditorEvent =
  | {
      type: "widgetContentsEdited";
      fieldTitle: T.WidgetDef["fieldTitle"];
      contents: T.WidgetContent[];
    }
  | { type: "collectionChanged"; collectionId: number }
  | { type: "readyForDisplayChanged"; readyForDisplay: boolean }
  | { type: "availableAfterChanged"; availableAfter: T.PHPDateTime | null }
  | { type: "newAssetRequested"; collectionId: number; templateId: number }
  | { type: "existingAssetRequested"; assetId: string }
  | {
      /**
       * The document an awaitingTemplate model asked for arrived. It
       * carries its templateId back, so a document for a template the
       * user has moved past cannot scaffold the newer request's draft.
       */
      type: "templateDocumentLoaded";
      templateId: number;
      template: T.Template;
    }
  | { type: "templateDocumentLoadFailed"; templateId: number; error: Error }
  | { type: "assetLoadFailed"; assetId: string; error: Error }
  | { type: "templateMigrationRequested"; templateId: number }
  | {
      type: "templateMigrated";
      templateId: number;
      /** input for scaffolding and diffing, never stored */
      template: T.Template;
      /** the current baseline, null for drafts. Input for the diff. */
      baseline: T.Asset | null;
    }
  | { type: "templateMigrationFailed"; templateId: number; error: Error }
  | {
      /**
       * The create response returned an objectId, before the read-back of
       * the stored document. `baseline` is the draft as it was sent,
       * stamped with the new id and scaffolded: the closest thing to
       * server truth until the read-back replaces it.
       */
      type: "assetCreated";
      draftKey: string;
      baseline: T.Asset;
      /** input for the diff, never stored */
      template: T.Template;
    }
  | {
      /**
       * The server accepted an update save. The document read-back arrives
       * separately as baselineRefreshed; this event only retires client-only
       * state the save has now delivered.
       */
      type: "saveAccepted";
      assetId: string;
      template: T.Template;
    }
  | {
      /**
       * The baseline in the cache changed: a save's read-back, an inline
       * child save's invalidation, a future freshness refetch. All arrive
       * through this one door and get the same rebase treatment.
       */
      type: "baselineRefreshed";
      assetId: string;
      /** the new baseline in editor shape. Input for the rebase, never stored. */
      baseline: T.Asset;
      template: T.Template;
    }
  | { type: "resetRequested" };

/**
 * The editor's only state transition function.
 *
 * A resolution carrying an identity the model no longer holds is dropped:
 * work that finishes after the editor took in a different asset must not
 * touch that asset. Events without an identity apply only while an asset
 * is being edited.
 *
 * Not referentially transparent: arms that build drafts mint a draftKey
 * and widget content uuids via crypto.randomUUID().
 */
export function editorReducer(
  model: EditorModel,
  event: EditorEvent
): EditorStep {
  switch (event.type) {
    case "newAssetRequested":
      return {
        model: {
          status: "awaitingTemplate",
          collectionId: event.collectionId,
          templateId: event.templateId,
        },
      };
    case "existingAssetRequested":
      // the model switches immediately: it holds only the asset's identity,
      // and the view stays empty until that asset's baseline arrives
      return {
        model: {
          status: "editingExistingAsset",
          assetId: event.assetId,
          edits: {},
          pendingTemplateId: null,
        },
      };
    case "templateDocumentLoaded":
      return { model: onTemplateDocumentLoaded(model, event) };
    case "templateDocumentLoadFailed":
      return { model: onTemplateDocumentLoadFailed(model, event) };
    case "assetLoadFailed":
      return { model: onAssetLoadFailed(model, event) };
    case "templateMigrationRequested":
      if (!isEditingAsset(model)) return { model };
      return { model: { ...model, pendingTemplateId: event.templateId } };
    case "templateMigrated":
      return { model: onTemplateMigrated(model, event) };
    case "templateMigrationFailed":
      // the editor keeps its current template and the asset stays editable:
      // a failed swap must not cost the user work in progress
      if (!isEditingAsset(model)) return { model };
      if (event.templateId !== model.pendingTemplateId) return { model };
      return { model: { ...model, pendingTemplateId: null } };
    case "widgetContentsEdited":
      return {
        model: modelWithFieldEdit(model, event.fieldTitle, event.contents),
      };
    case "collectionChanged":
      return {
        model: modelWithFieldEdit(model, "collectionId", event.collectionId),
      };
    case "readyForDisplayChanged":
      return {
        model: modelWithFieldEdit(
          model,
          "readyForDisplay",
          event.readyForDisplay
        ),
      };
    case "availableAfterChanged":
      return {
        model: modelWithFieldEdit(
          model,
          "availableAfter",
          event.availableAfter
        ),
      };
    case "assetCreated":
      return onAssetCreated(model, event);
    case "saveAccepted":
      return { model: onSaveAccepted(model, event) };
    case "baselineRefreshed":
      return { model: onBaselineRefreshed(model, event) };
    case "resetRequested":
      return { model: { status: "idle" } };
    default:
      return assertNever(event);
  }
}

function onTemplateDocumentLoaded(
  model: EditorModel,
  event: { templateId: number; template: T.Template }
): EditorModel {
  if (model.status !== "awaitingTemplate") return model;
  if (event.templateId !== model.templateId) return model;
  return {
    status: "editingNewAsset",
    draftKey: crypto.randomUUID(),
    localAsset: makeNewLocalAsset({
      template: event.template,
      collectionId: model.collectionId,
    }),
    pendingTemplateId: null,
  };
}

function onTemplateDocumentLoadFailed(
  model: EditorModel,
  event: { templateId: number; error: Error }
): EditorModel {
  if (model.status !== "awaitingTemplate") return model;
  if (event.templateId !== model.templateId) return model;
  return { status: "assetLoadFailed", error: event.error };
}

function onAssetLoadFailed(
  model: EditorModel,
  event: { assetId: string; error: Error }
): EditorModel {
  if (model.status !== "editingExistingAsset") return model;
  if (event.assetId !== model.assetId) return model;
  return { status: "assetLoadFailed", error: event.error };
}

function onTemplateMigrated(
  model: EditorModel,
  event: { templateId: number; template: T.Template; baseline: T.Asset | null }
): EditorModel {
  if (!isEditingAsset(model)) return model;
  if (event.templateId !== model.pendingTemplateId) return model;
  switch (model.status) {
    case "editingNewAsset":
      return {
        ...model,
        localAsset: migrateAssetToTemplate(model.localAsset, event.template),
        pendingTemplateId: null,
      };
    case "editingExistingAsset": {
      const onScreen = selectLocalAsset(model, event.baseline);
      if (!onScreen || !event.baseline) return model;
      // the migrated asset differs from the baseline by its new templateId
      // and the fields the new template scaffolds, all of which a save must
      // send
      const migrated = migrateAssetToTemplate(
        onScreen as T.Asset,
        event.template
      );
      return {
        ...model,
        edits: diffEditableFields({
          draft: migrated,
          savedAsset: event.baseline,
          template: event.template,
        }),
        pendingTemplateId: null,
      };
    }
    default:
      return assertNever(model);
  }
}

/** Write one field, whichever way the current status stores changes. */
function modelWithFieldEdit(
  model: EditorModel,
  assetKey: string,
  value: unknown
): EditorModel {
  if (!isEditingAsset(model)) return model;
  switch (model.status) {
    case "editingNewAsset":
      return {
        ...model,
        localAsset: { ...model.localAsset, [assetKey]: value },
      };
    case "editingExistingAsset":
      // an edit equal to the baseline is not dropped here: the reducer holds
      // no baseline to compare against. Dirtiness compares in stored shape
      // anyway, and the next baselineRefreshed prunes redundant edits.
      return {
        ...model,
        edits: { ...model.edits, [assetKey]: value },
      };
    default:
      return assertNever(model);
  }
}

function onAssetCreated(
  model: EditorModel,
  event: { draftKey: string; baseline: T.Asset; template: T.Template }
): EditorStep {
  if (model.status !== "editingNewAsset") return { model };
  if (event.draftKey !== model.draftKey) return { model };

  // the echoed baseline was flag-cleared before dispatch, so the draft loses
  // its flags the same way or they would read as edits made after the send
  const latestLocalAsset = clearUploadRegenerationFlags(
    model.localAsset,
    event.template
  );

  return {
    model: {
      status: "editingExistingAsset",
      assetId: event.baseline.assetId,
      // anything typed while the create was in flight differs from the echo
      // and stays pending for the next save
      edits: diffEditableFields({
        draft: latestLocalAsset,
        savedAsset: event.baseline,
        template: event.template,
      }),
      pendingTemplateId: null,
    },
    commands: [{ type: "notifyAssetCreated", assetId: event.baseline.assetId }],
  };
}

function onSaveAccepted(
  model: EditorModel,
  event: { assetId: string; template: T.Template }
): EditorModel {
  if (model.status !== "editingExistingAsset") return model;
  if (event.assetId !== model.assetId) return model;
  return {
    ...model,
    edits: clearUploadRegenerationFlags(model.edits, event.template),
  };
}

/**
 * The rebase: take the refreshed baseline, keep every edit that still
 * differs from it, and drop the ones it made redundant. Untouched fields
 * follow the new baseline by construction, because they were never in
 * `edits` to begin with.
 */
function onBaselineRefreshed(
  model: EditorModel,
  event: { assetId: string; baseline: T.Asset; template: T.Template }
): EditorModel {
  if (model.status !== "editingExistingAsset") return model;
  if (event.assetId !== model.assetId) return model;
  return {
    ...model,
    edits: diffEditableFields({
      draft: { ...event.baseline, ...model.edits },
      savedAsset: event.baseline,
      template: event.template,
    }),
  };
}

function assertNever(value: never): never {
  throw new Error(`Unhandled case in the editor: ${JSON.stringify(value)}`);
}
