import * as T from "@/types";
import {
  clearUploadRegenerationFlags,
  diffEditableFields,
  editsWithFieldEdit,
  makeLocalAssetFromSaved,
  makeNewLocalAsset,
  migrateAssetToTemplate,
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
  | { status: "loadFailed"; editorGeneration: number; error: Error }
  | { status: "loadingTemplate"; editorGeneration: number; collectionId: number }
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

/** The asset being edited: the saved baseline with pending edits laid over it. */
export function selectLocalAsset(
  model: EditorModel
): T.Asset | T.UnsavedAsset | null {
  switch (model.status) {
    case "editingNewAsset":
      return model.localAsset;
    case "editingExistingAsset":
      return { ...model.savedAsset, ...model.edits };
    default:
      return null;
  }
}

/** The error that left the editor with nothing to edit. */
export function selectLoadError(model: EditorModel): Error | null {
  return model.status === "loadFailed" ? model.error : null;
}

/** An asset that has never been saved always counts as unsaved work. */
export function selectHasUnsavedEdits(model: EditorModel): boolean {
  switch (model.status) {
    case "editingNewAsset":
      return true;
    case "editingExistingAsset":
      return Object.keys(model.edits).length > 0;
    default:
      return false;
  }
}

/**
 * Everything that can change the model.
 *
 * The `editorGeneration` rides on the events that resolve async work, so
 * a resolution about something the editor no longer holds can be dropped.
 */
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
      type: "saveSucceeded";
      editorGeneration: number;
      didCreateAsset: boolean;
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
): EditorModel {
  switch (event.type) {
    case "newAssetRequested":
      return {
        status: "loadingTemplate",
        editorGeneration: model.editorGeneration + 1,
        collectionId: event.collectionId,
      };
    case "existingAssetRequested":
      // advance the generation so results still in flight can no longer
      // land, but stay put: the current asset remains editable while the
      // next one loads
      return { ...model, editorGeneration: model.editorGeneration + 1 };
    case "templateLoaded":
      return onTemplateLoaded(model, event);
    case "templateLoadFailed":
      return onTemplateLoadFailed(model, event);
    case "assetLoadFailed":
      return onLoadFailed(model, event);
    case "assetLoaded":
      return onAssetLoaded(model, event);
    case "templateMigrated":
      return onTemplateMigrated(model, event);
    case "widgetContentsEdited":
      return modelWithFieldEdit(model, event.fieldTitle, event.contents);
    case "collectionChanged":
      return modelWithFieldEdit(model, "collectionId", event.collectionId);
    case "readyForDisplayChanged":
      return modelWithFieldEdit(
        model,
        "readyForDisplay",
        event.readyForDisplay
      );
    case "availableAfterChanged":
      return modelWithFieldEdit(model, "availableAfter", event.availableAfter);
    case "saveSucceeded":
      return onSaveSucceeded(model, event);
    case "resetRequested":
      return { status: "idle", editorGeneration: model.editorGeneration + 1 };
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
    status: "loadFailed",
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
        selectLocalAsset(model) as T.Asset,
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
      return model;
  }
}

/** Write one field, whichever way the current status stores changes. */
function modelWithFieldEdit(
  model: EditorModel,
  assetKey: string,
  value: unknown
): EditorModel {
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
      return model;
  }
}

function onSaveSucceeded(
  model: EditorModel,
  event: { editorGeneration: number; didCreateAsset: boolean; savedAsset: T.Asset }
): EditorModel {
  if (
    model.status !== "editingNewAsset" &&
    model.status !== "editingExistingAsset"
  ) {
    return model;
  }

  // a create response carries the only copy of the new assetId, so while
  // the editor still holds an unsaved draft it is taken even from a
  // superseded generation: a duplicate asset on the next save is worse
  // than showing a stale one
  const isCreateResponseForUnsavedDraft =
    event.didCreateAsset && model.status === "editingNewAsset";
  if (
    !isCreateResponseForUnsavedDraft &&
    event.editorGeneration !== model.editorGeneration
  ) {
    return model;
  }
  const latestLocalAsset = clearUploadRegenerationFlags(
    selectLocalAsset(model) as T.Asset | T.UnsavedAsset,
    model.template
  );

  const savedAsset = makeLocalAssetFromSaved({
    template: model.template,
    collectionId: event.savedAsset.collectionId,
    savedAsset: event.savedAsset,
    // the response describes the document just sent, so its contents keep the
    // ids they already had and the form is not rebuilt around new keys
    previousAsset: latestLocalAsset,
  });

  return {
    status: "editingExistingAsset",
    editorGeneration: model.editorGeneration,
    template: model.template,
    savedAsset,
    // edits made while the request was in flight are still pending
    edits: diffEditableFields({
      draft: latestLocalAsset,
      savedAsset,
      template: model.template,
    }),
  };
}

function assertNever(event: never): never {
  throw new Error(`Unhandled editor event: ${JSON.stringify(event)}`);
}
