import * as T from "@/types";
import {
  clearUploadRegenerationFlags,
  diffEditableFields,
  editsWithFieldEdit,
  makeLocalAssetFromSaved,
  makeNewLocalAsset,
  migrateAssetToTemplate,
  wouldSaveChangeStoredAsset,
} from "./localAsset";

/**
 * The editor is always in exactly one of these states.
 *
 * `editorGeneration` counts how many times the editor has moved on. It
 * advances each time the editor takes in a different asset or draft, or
 * empties out, and stays put while the user edits. assetId cannot do
 * this job: it is null on every draft, absent while nothing is loaded,
 * and unchanged when the same asset is reopened.
 *
 * Async work captures the generation it starts under and carries it back
 * on its resolution event. A resolution carrying a different generation
 * is about something the editor no longer holds, so the reducer drops it
 * instead of applying it to the wrong asset.
 */
export type EditorModel =
  | { status: "idle"; editorGeneration: number }
  | { status: "assetLoadFailed"; editorGeneration: number; error: Error }
  | {
      status: "loadingTemplate";
      editorGeneration: number;
      collectionId: number;
    }
  | {
      status: "editingNewAsset";
      editorGeneration: number;
      localAsset: T.UnsavedAsset;
      template: T.Template;
    }
  | {
      status: "editingExistingAsset";
      editorGeneration: number;
      /**
       * What the server has, in editor representation (widget contents
       * scaffolded and given ids). The baseline edits are measured against.
       */
      savedAsset: T.Asset;
      /**
       * Only the fields the user has changed since. Everything else is read
       * through from `savedAsset`, so a save response refreshes untouched
       * fields for free.
       */
      edits: Partial<T.Asset>;
      template: T.Template;
    };

export const initialEditorModel: EditorModel = {
  status: "idle",
  editorGeneration: 0,
};

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

/** The asset being edited: the saved baseline with pending edits laid over it. */
export function selectEditedAsset(
  model: EditingModel
): T.Asset | T.UnsavedAsset {
  switch (model.status) {
    case "editingNewAsset":
      return model.localAsset;
    case "editingExistingAsset":
      return { ...model.savedAsset, ...model.edits };
    default:
      return assertNever(model);
  }
}

/** The asset being edited, or null in the statuses that hold none. */
export function selectLocalAsset(
  model: EditorModel
): T.Asset | T.UnsavedAsset | null {
  return isEditingAsset(model) ? selectEditedAsset(model) : null;
}

/** The error that left the editor with nothing to edit. */
export function selectLoadError(model: EditorModel): Error | null {
  return model.status === "assetLoadFailed" ? model.error : null;
}

/** Whether the editor holds work a save would send and leaving would lose. */
export function selectHasUnsavedEdits(model: EditorModel): boolean {
  if (!isEditingAsset(model)) return false;
  switch (model.status) {
    case "editingNewAsset":
      // an untouched draft is not unsaved work, or the leave guard would
      // nag on a create page the user never typed into
      return wouldSaveChangeStoredAsset({
        draft: model.localAsset,
        savedAsset: makeNewLocalAsset({
          template: model.template,
          collectionId: model.localAsset.collectionId,
        }),
        template: model.template,
      });
    case "editingExistingAsset":
      // `edits` may hold differences the server would never store, like a
      // freshly added blank row, so dirtiness is measured against what a
      // save would actually change
      return wouldSaveChangeStoredAsset({
        draft: selectEditedAsset(model),
        savedAsset: model.savedAsset,
        template: model.template,
      });
    default:
      return assertNever(model);
  }
}

/**
 * An effect the reducer asks the shell to run. Commands are data so the
 * decision to act stays in the reducer, where stale generations are already
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
  commands: EditorCommand[];
}

const makeStep = (
  model: EditorModel,
  commands: EditorCommand[] = []
): EditorStep => ({
  model,
  commands,
});

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
  | { type: "newAssetRequested"; collectionId: number }
  | { type: "existingAssetRequested" }
  | { type: "templateMigrationRequested" }
  | { type: "templateLoaded"; editorGeneration: number; template: T.Template }
  | { type: "templateLoadFailed"; editorGeneration: number; error: Error }
  | { type: "assetLoadFailed"; editorGeneration: number; error: Error }
  | {
      type: "assetLoaded";
      editorGeneration: number;
      savedAsset: T.Asset;
      template: T.Template;
    }
  | { type: "templateMigrated"; editorGeneration: number; template: T.Template }
  | {
      type: "templateMigrationFailed";
      editorGeneration: number;
      error: Error;
    }
  | {
      /**
       * The create response returned an objectId, before the read-back of
       * the stored document. `savedAsset` is the draft as it was sent,
       * stamped with the new id: the closest thing to server truth until
       * `saveSucceeded` replaces it.
       */
      type: "assetCreated";
      editorGeneration: number;
      savedAsset: T.Asset;
    }
  | {
      type: "saveSucceeded";
      editorGeneration: number;
      savedAsset: T.Asset;
    }
  | { type: "resetRequested" };

/**
 * The editor's only state transition function.
 *
 * A resolution carrying a different editorGeneration or arriving in the
 * wrong status is dropped: work that finishes after the editor took in a
 * different asset must not touch that asset. Events without a generation
 * apply only while an asset is being edited.
 *
 * Not referentially transparent: arms that build widget contents assign
 * fresh item ids via crypto.randomUUID().
 */
export function editorReducer(
  model: EditorModel,
  event: EditorEvent
): EditorStep {
  switch (event.type) {
    case "newAssetRequested":
      return makeStep({
        status: "loadingTemplate",
        editorGeneration: model.editorGeneration + 1,
        collectionId: event.collectionId,
      });
    case "existingAssetRequested":
    case "templateMigrationRequested":
      // advance the generation so results still in flight can no longer
      // land, but stay put: the current asset remains editable while the
      // next asset or template loads
      return makeStep({ ...model, editorGeneration: model.editorGeneration + 1 });
    case "templateLoaded":
      return makeStep(onTemplateLoaded(model, event));
    case "templateLoadFailed":
      return makeStep(onTemplateLoadFailed(model, event));
    case "assetLoadFailed":
      return makeStep(onLoadFailed(model, event));
    case "assetLoaded":
      return makeStep(onAssetLoaded(model, event));
    case "templateMigrated":
      return makeStep(onTemplateMigrated(model, event));
    case "templateMigrationFailed":
      // the editor keeps its current template and the asset stays editable:
      // a failed swap must not cost the user work in progress
      return makeStep(model);
    case "widgetContentsEdited":
      return makeStep(modelWithFieldEdit(model, event.fieldTitle, event.contents));
    case "collectionChanged":
      return makeStep(modelWithFieldEdit(model, "collectionId", event.collectionId));
    case "readyForDisplayChanged":
      return makeStep(
        modelWithFieldEdit(model, "readyForDisplay", event.readyForDisplay)
      );
    case "availableAfterChanged":
      return makeStep(
        modelWithFieldEdit(model, "availableAfter", event.availableAfter)
      );
    case "assetCreated":
      return onAssetCreated(model, event);
    case "saveSucceeded":
      return makeStep(onSaveSucceeded(model, event));
    case "resetRequested":
      return makeStep({
        status: "idle",
        editorGeneration: model.editorGeneration + 1,
      });
    default:
      return assertNever(event);
  }
}

function onTemplateLoaded(
  model: EditorModel,
  event: { editorGeneration: number; template: T.Template }
): EditorModel {
  if (model.status !== "loadingTemplate") return model;
  if (event.editorGeneration !== model.editorGeneration) return model;
  return {
    status: "editingNewAsset",
    editorGeneration: model.editorGeneration,
    template: event.template,
    localAsset: makeNewLocalAsset({
      template: event.template,
      collectionId: model.collectionId,
    }),
  };
}

function onTemplateLoadFailed(
  model: EditorModel,
  event: { editorGeneration: number; error: Error }
): EditorModel {
  if (model.status !== "loadingTemplate") return model;
  return onLoadFailed(model, event);
}

function onLoadFailed(
  model: EditorModel,
  event: { editorGeneration: number; error: Error }
): EditorModel {
  if (event.editorGeneration !== model.editorGeneration) return model;
  return {
    status: "assetLoadFailed",
    editorGeneration: model.editorGeneration + 1,
    error: event.error,
  };
}

function onAssetLoaded(
  model: EditorModel,
  event: { editorGeneration: number; savedAsset: T.Asset; template: T.Template }
): EditorModel {
  if (event.editorGeneration !== model.editorGeneration) return model;
  return {
    status: "editingExistingAsset",
    // new generation: the previous asset stayed editable while this one
    // loaded, so work started in that window must not land on the new
    // asset
    editorGeneration: model.editorGeneration + 1,
    template: event.template,
    savedAsset: makeLocalAssetFromSaved({
      template: event.template,
      collectionId: event.savedAsset.collectionId,
      savedAsset: event.savedAsset,
    }),
    edits: {},
  };
}

function onTemplateMigrated(
  model: EditorModel,
  event: { editorGeneration: number; template: T.Template }
): EditorModel {
  if (event.editorGeneration !== model.editorGeneration) return model;
  if (!isEditingAsset(model)) return model;
  switch (model.status) {
    case "editingNewAsset":
      return {
        ...model,
        template: event.template,
        localAsset: migrateAssetToTemplate(model.localAsset, event.template),
      };
    case "editingExistingAsset": {
      // the migrated asset differs from the saved one by its new templateId
      // and the fields the new template scaffolds, all of which a save must
      // send
      const migrated = migrateAssetToTemplate(
        selectEditedAsset(model) as T.Asset,
        event.template
      );
      return {
        ...model,
        template: event.template,
        edits: diffEditableFields({
          draft: migrated,
          savedAsset: model.savedAsset,
          template: event.template,
        }),
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
      return {
        ...model,
        edits: editsWithFieldEdit({
          edits: model.edits,
          savedAsset: model.savedAsset,
          assetKey,
          value,
        }),
      };
    default:
      return assertNever(model);
  }
}

function onSaveSucceeded(
  model: EditorModel,
  event: { editorGeneration: number; savedAsset: T.Asset }
): EditorModel {
  if (!isEditingAsset(model)) return model;

  // creates included: the assetCreated event already carried the new id to
  // the draft it belongs to, so a superseded response here describes an
  // asset this editor no longer holds and a different draft must not adopt it
  if (event.editorGeneration !== model.editorGeneration) {
    return model;
  }
  return modelWithSavedAssetApplied(model, event.savedAsset);
}

function onAssetCreated(
  model: EditorModel,
  event: { editorGeneration: number; savedAsset: T.Asset }
): EditorStep {
  // a commit for a draft the editor no longer holds is dropped, like its
  // read-back will be in onSaveSucceeded
  if (model.status !== "editingNewAsset") return makeStep(model);
  if (event.editorGeneration !== model.editorGeneration) return makeStep(model);

  return makeStep(modelWithSavedAssetApplied(model, event.savedAsset), [
    { type: "notifyAssetCreated", assetId: event.savedAsset.assetId },
  ]);
}

/**
 * Take `savedAsset` as the new baseline the moment the server holds it,
 * keeping the ids on screen and leaving edits made while the request was
 * in flight pending.
 */
function modelWithSavedAssetApplied(
  model: EditingModel,
  incomingSavedAsset: T.Asset
): EditorModel {
  // both sides lose the flag together. A server payload never carries it, so
  // clearing the incoming asset only matters for the draft `assetCreated`
  // echoes back, and doing it here keeps the two sides from disagreeing
  const latestLocalAsset = clearUploadRegenerationFlags(
    selectEditedAsset(model),
    model.template
  );

  const savedAsset = makeLocalAssetFromSaved({
    template: model.template,
    collectionId: incomingSavedAsset.collectionId,
    savedAsset: clearUploadRegenerationFlags(
      incomingSavedAsset,
      model.template
    ),
    // the response describes the document just sent, so its contents keep the
    // ids they already had and the form is not rebuilt around new keys
    previousAsset: latestLocalAsset,
  });

  return {
    status: "editingExistingAsset",
    editorGeneration: model.editorGeneration,
    template: model.template,
    savedAsset,
    edits: diffEditableFields({
      draft: latestLocalAsset,
      savedAsset,
      template: model.template,
    }),
  };
}

function assertNever(value: never): never {
  throw new Error(`Unhandled case in the editor: ${JSON.stringify(value)}`);
}
