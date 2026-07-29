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
 * `fencingToken` is a temporary id for the thing being edited. It stands
 * in for assetId, which cannot tell things apart when it matters most:
 * assetId is null on every draft, absent while nothing is loaded, and
 * unchanged when the same asset is reopened. A new token is issued each
 * time the editor takes in a different asset or draft, or empties out.
 *
 * Async work captures the token it starts under and carries it back on
 * its resolution event. A resolution bearing an old token is about a
 * thing the editor no longer holds, so the reducer drops it (fences it
 * out) instead of applying it to the wrong asset.
 */
export type EditorModel =
  | { status: "idle"; fencingToken: number }
  | { status: "loadFailed"; fencingToken: number; error: Error }
  | { status: "loadingTemplate"; fencingToken: number; collectionId: number }
  | {
      status: "editingNewAsset";
      fencingToken: number;
      localAsset: T.UnsavedAsset;
      template: T.Template;
    }
  | {
      status: "editingExistingAsset";
      fencingToken: number;
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
  fencingToken: 0,
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
 * A `fencingToken` rides on the events that resolve async work, so a
 * resolution about something the editor no longer holds can be dropped.
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
  | { type: "templateLoaded"; fencingToken: number; template: T.Template }
  | { type: "templateLoadFailed"; fencingToken: number; error: Error }
  | { type: "assetLoadFailed"; fencingToken: number; error: Error }
  | {
      type: "assetLoaded";
      fencingToken: number;
      savedAsset: T.Asset;
      template: T.Template;
    }
  | { type: "templateMigrated"; fencingToken: number; template: T.Template }
  | {
      type: "saveSucceeded";
      fencingToken: number;
      didCreateAsset: boolean;
      savedAsset: T.Asset;
    }
  | { type: "resetRequested" };

/**
 * The editor's only state transition function.
 *
 * A resolution bearing an old fencingToken or arriving in the wrong
 * status is dropped: work that finishes after the editor took in a
 * different asset must not touch that asset. Events without a token
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
        fencingToken: model.fencingToken + 1,
        collectionId: event.collectionId,
      };
    case "existingAssetRequested":
      // issue a new token so results still in flight can no longer land,
      // but stay put: the current asset remains editable while the next
      // one loads
      return { ...model, fencingToken: model.fencingToken + 1 };
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
      return { status: "idle", fencingToken: model.fencingToken + 1 };
    default:
      return assertNever(event);
  }
}

function onTemplateLoaded(
  model: EditorModel,
  event: { fencingToken: number; template: T.Template }
): EditorModel {
  if (model.status !== "loadingTemplate") return model;
  if (event.fencingToken !== model.fencingToken) return model;
  return {
    status: "editingNewAsset",
    fencingToken: model.fencingToken,
    template: event.template,
    localAsset: makeNewLocalAsset({
      template: event.template,
      collectionId: model.collectionId,
    }),
  };
}

function onTemplateLoadFailed(
  model: EditorModel,
  event: { fencingToken: number; error: Error }
): EditorModel {
  if (model.status !== "loadingTemplate") return model;
  return onLoadFailed(model, event);
}

function onLoadFailed(
  model: EditorModel,
  event: { fencingToken: number; error: Error }
): EditorModel {
  if (event.fencingToken !== model.fencingToken) return model;
  return {
    status: "loadFailed",
    fencingToken: model.fencingToken + 1,
    error: event.error,
  };
}

function onAssetLoaded(
  model: EditorModel,
  event: { fencingToken: number; savedAsset: T.Asset; template: T.Template }
): EditorModel {
  if (event.fencingToken !== model.fencingToken) return model;
  return {
    status: "editingExistingAsset",
    // new token: the previous asset stayed editable while this one
    // loaded, so work started in that window must not land on the new
    // asset
    fencingToken: model.fencingToken + 1,
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
  event: { fencingToken: number; template: T.Template }
): EditorModel {
  if (event.fencingToken !== model.fencingToken) return model;
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
  event: { fencingToken: number; didCreateAsset: boolean; savedAsset: T.Asset }
): EditorModel {
  if (
    model.status !== "editingNewAsset" &&
    model.status !== "editingExistingAsset"
  ) {
    return model;
  }

  // a create response carries the only copy of the new assetId, so while
  // the editor still holds an unsaved draft it is taken even with an old
  // token: a duplicate asset on the next save is worse than showing a
  // stale one
  const isCreateResponseForUnsavedDraft =
    event.didCreateAsset && model.status === "editingNewAsset";
  if (
    !isCreateResponseForUnsavedDraft &&
    event.fencingToken !== model.fencingToken
  ) {
    return model;
  }
  const savedAsset = makeLocalAssetFromSaved({
    template: model.template,
    collectionId: event.savedAsset.collectionId,
    savedAsset: event.savedAsset,
  });

  const latestLocalAsset = clearUploadRegenerationFlags(
    selectLocalAsset(model) as T.Asset | T.UnsavedAsset,
    model.template
  );

  return {
    status: "editingExistingAsset",
    fencingToken: model.fencingToken,
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
