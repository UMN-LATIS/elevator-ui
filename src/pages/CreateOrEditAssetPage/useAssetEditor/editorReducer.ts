import * as T from "@/types";
import {
  applySaveResult,
  makeLocalAssetFromSaved,
  makeNewLocalAsset,
  migrateAssetToTemplate,
} from "./localAsset";

/**
 * The editor is always in exactly one of these states.
 *
 * `generation` identifies the editing session. Events that start a new
 * session bump it. Effect events carry the generation they started under,
 * so one from an abandoned session is dropped instead of corrupting the
 * current one.
 */
export type EditorModel =
  | { status: "uninitialized"; generation: number }
  | { status: "loadingTemplate"; generation: number; collectionId: number }
  | {
      status: "editingNew";
      generation: number;
      localAsset: T.UnsavedAsset;
      template: T.Template;
    }
  | {
      status: "editingSaved";
      generation: number;
      localAsset: T.Asset;
      savedAsset: T.Asset;
      template: T.Template;
    };

export const initialEditorModel: EditorModel = {
  status: "uninitialized",
  generation: 0,
};

/**
 * Something the user did. Any consumer may report one: knowing it happened
 * takes no I/O.
 */
export type EditorIntent =
  | { type: "localAssetEdited"; edit: T.Asset | T.UnsavedAsset }
  | {
      type: "widgetContentsEdited";
      fieldTitle: T.WidgetDef["fieldTitle"];
      contents: T.WidgetContent[];
    }
  | { type: "collectionChanged"; collectionId: number };

/**
 * An operation the shell runs reporting its own progress: it started, it
 * finished, it failed. Only the shell may report these, because only the
 * code running the operation knows.
 */
export type EffectEvent =
  | { type: "newAssetRequested"; collectionId: number }
  | { type: "assetRequested" }
  | { type: "templateLoaded"; generation: number; template: T.Template }
  | { type: "templateLoadFailed"; generation: number }
  | {
      type: "assetLoaded";
      generation: number;
      savedAsset: T.Asset;
      template: T.Template;
    }
  | { type: "templateMigrated"; generation: number; template: T.Template }
  | { type: "saveSucceeded"; generation: number; savedAsset: T.Asset }
  | { type: "resetRequested" };

export type EditorEvent = EditorIntent | EffectEvent;

/**
 * The editor's only state transition function.
 *
 * Effect events from a stale generation or the wrong status are dropped: an
 * operation that resolves after the editor moved on must not resurrect the
 * session it started in. Intents apply only in the editing statuses.
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
        generation: model.generation + 1,
        collectionId: event.collectionId,
      };
    case "assetRequested":
      // bump so events from the still-visible previous session are dropped,
      // but stay put: the current asset remains editable while the next
      // one loads
      return { ...model, generation: model.generation + 1 };
    case "templateLoaded":
      return onTemplateLoaded(model, event);
    case "templateLoadFailed":
      return onTemplateLoadFailed(model, event);
    case "assetLoaded":
      return onAssetLoaded(model, event);
    case "templateMigrated":
      return onTemplateMigrated(model, event);
    case "localAssetEdited":
      return onLocalAssetEdited(model, event.edit);
    case "widgetContentsEdited":
      return onWidgetContentsEdited(model, event.fieldTitle, event.contents);
    case "collectionChanged":
      return onCollectionChanged(model, event.collectionId);
    case "saveSucceeded":
      return onSaveSucceeded(model, event);
    case "resetRequested":
      return { status: "uninitialized", generation: model.generation + 1 };
    default:
      return assertNever(event);
  }
}

function onTemplateLoaded(
  model: EditorModel,
  event: { generation: number; template: T.Template }
): EditorModel {
  if (model.status !== "loadingTemplate") return model;
  if (event.generation !== model.generation) return model;
  return {
    status: "editingNew",
    generation: model.generation,
    template: event.template,
    localAsset: makeNewLocalAsset({
      template: event.template,
      collectionId: model.collectionId,
    }),
  };
}

function onTemplateLoadFailed(
  model: EditorModel,
  event: { generation: number }
): EditorModel {
  if (model.status !== "loadingTemplate") return model;
  if (event.generation !== model.generation) return model;
  return { status: "uninitialized", generation: model.generation + 1 };
}

function onAssetLoaded(
  model: EditorModel,
  event: { generation: number; savedAsset: T.Asset; template: T.Template }
): EditorModel {
  if (event.generation !== model.generation) return model;
  return {
    status: "editingSaved",
    // bump: the previous asset stayed editable while this one loaded, so
    // operations started in that window must not land on the new asset
    generation: model.generation + 1,
    template: event.template,
    // clone the baseline so nothing outside shares references with it
    savedAsset: structuredClone(event.savedAsset),
    localAsset: makeLocalAssetFromSaved({
      template: event.template,
      collectionId: event.savedAsset.collectionId,
      savedAsset: event.savedAsset,
    }),
  };
}

function onTemplateMigrated(
  model: EditorModel,
  event: { generation: number; template: T.Template }
): EditorModel {
  if (event.generation !== model.generation) return model;
  switch (model.status) {
    case "editingNew":
      return {
        ...model,
        template: event.template,
        localAsset: migrateAssetToTemplate(model.localAsset, event.template),
      };
    case "editingSaved":
      return {
        ...model,
        template: event.template,
        localAsset: migrateAssetToTemplate(model.localAsset, event.template),
      };
    default:
      return model;
  }
}

function onLocalAssetEdited(
  model: EditorModel,
  edit: T.Asset | T.UnsavedAsset
): EditorModel {
  switch (model.status) {
    case "editingNew":
      // whatever the payload claims, an unsaved editor stays unsaved
      return {
        ...model,
        localAsset: { ...edit, assetId: null, modified: null },
      };
    case "editingSaved":
      // identity comes from the model, never from a payload: a stale edit
      // with an empty assetId must not turn the next save into a create
      return {
        ...model,
        localAsset: {
          ...edit,
          assetId: model.localAsset.assetId,
          modified: model.localAsset.modified,
        },
      };
    default:
      return model;
  }
}

function onWidgetContentsEdited(
  model: EditorModel,
  fieldTitle: T.WidgetDef["fieldTitle"],
  contents: T.WidgetContent[]
): EditorModel {
  switch (model.status) {
    case "editingNew":
      return {
        ...model,
        localAsset: { ...model.localAsset, [fieldTitle]: contents },
      };
    case "editingSaved":
      return {
        ...model,
        localAsset: { ...model.localAsset, [fieldTitle]: contents },
      };
    default:
      return model;
  }
}

function onCollectionChanged(
  model: EditorModel,
  collectionId: number
): EditorModel {
  switch (model.status) {
    case "editingNew":
      return { ...model, localAsset: { ...model.localAsset, collectionId } };
    case "editingSaved":
      return { ...model, localAsset: { ...model.localAsset, collectionId } };
    default:
      return model;
  }
}

function onSaveSucceeded(
  model: EditorModel,
  event: { generation: number; savedAsset: T.Asset }
): EditorModel {
  if (event.generation !== model.generation) return model;
  if (model.status !== "editingNew" && model.status !== "editingSaved") {
    return model;
  }
  // the unsaved-to-saved transition as one checked value
  return {
    status: "editingSaved",
    generation: model.generation,
    template: model.template,
    savedAsset: structuredClone(event.savedAsset),
    localAsset: applySaveResult(model.localAsset, event.savedAsset),
  };
}

function assertNever(event: never): never {
  throw new Error(`Unhandled editor event: ${JSON.stringify(event)}`);
}
