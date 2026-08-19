/**
 * Every way the editor's state can change, and the one function that
 * changes it.
 *
 * Fetches and saves happen elsewhere: the reducer describes them as
 * effects, and their results come back as events. Every event names the
 * open asset it belongs to, and every event answering an earlier request
 * also carries the id it answers. An answer for an open asset that has
 * closed, or one it no longer awaits, is dropped.
 */

import * as T from "@/types";
import {
  EditSessionKey,
  EditingAsset,
  EditorDeps,
  EditorEvent,
  EditorState,
  EditorStep,
  ParentLink,
  hasAssetDocument,
  initialEditorState,
} from "./types";
import {
  clearUploadRegenerationFlags,
  diffEditableFields,
  makeNewLocalAsset,
  migrateAssetToTemplate,
  toLocalAsset,
} from "./localAsset";
import { omit } from "ramda";

export function update(
  state: EditorState,
  event: EditorEvent,
  deps: EditorDeps
): EditorStep {
  switch (event.type) {
    case "newAssetRequested":
      return {
        state: stateWithAssetOpened(state, event.key, {
          status: "awaitingTemplate",
          parentLink: event.parentLink,
          collectionId: event.collectionId,
          templateId: event.templateId,
        }),
        effects: [
          {
            type: "fetchTemplate",
            key: event.key,
            templateId: event.templateId,
          },
        ],
      };
    case "existingAssetRequested":
      return {
        state: stateWithAssetOpened(state, event.key, {
          status: "editingExistingAsset",
          parentLink: event.parentLink,
          assetId: event.assetId,
          savedAsset: null,
          template: null,
          edits: {},
          pendingTemplateId: null,
          saveState: "idle",
        }),
        effects: [
          {
            type: "fetchAssetAndTemplate",
            key: event.key,
            assetId: event.assetId,
          },
        ],
      };
    case "assetClosed": {
      if (!state.assets[event.key]) return { state };
      return {
        state: {
          assets: omit([event.key], state.assets),
          rootKey: state.rootKey === event.key ? null : state.rootKey,
        },
      };
    }
    case "templateArrived":
      return { state: onTemplateArrived(state, event, deps) };
    case "templateLoadFailed":
      return { state: onTemplateLoadFailed(state, event) };
    case "assetAndTemplateArrived":
      return { state: onAssetAndTemplateArrived(state, event, deps) };
    case "assetLoadFailed": {
      const openAsset = state.assets[event.key];
      if (!openAsset || openAsset.status !== "editingExistingAsset") {
        return { state };
      }
      // only a load still being waited on can fail. Once the asset and its
      // template arrived, a late failure means nothing and must not cost
      // the open asset.
      if (openAsset.savedAsset !== null) return { state };
      return {
        state: stateWithOpenAsset(state, event.key, {
          status: "loadFailed",
          parentLink: openAsset.parentLink,
          error: event.error,
        }),
      };
    }
    case "templateMigrationRequested": {
      const openAsset = state.assets[event.key];
      if (!openAsset || !hasAssetDocument(openAsset)) return { state };
      return {
        state: stateWithOpenAsset(state, event.key, {
          ...openAsset,
          pendingTemplateId: event.templateId,
        }),
        effects: [
          {
            type: "fetchTemplate",
            key: event.key,
            templateId: event.templateId,
          },
        ],
      };
    }
    case "widgetContentsEdited":
      return {
        state: stateWithFieldEdit(
          state,
          event.key,
          event.fieldTitle,
          event.contents
        ),
      };
    case "uploadCompleted": {
      const nextState = stateWithFieldEdit(
        state,
        event.key,
        event.fieldTitle,
        event.contents
      );
      if (nextState === state) return { state };
      return {
        state: nextState,
        effects: [{ type: "requestSave", key: event.key }],
      };
    }
    case "collectionChanged":
      return {
        state: stateWithFieldEdit(
          state,
          event.key,
          "collectionId",
          event.collectionId
        ),
      };
    case "readyForDisplayChanged":
      return {
        state: stateWithFieldEdit(
          state,
          event.key,
          "readyForDisplay",
          event.readyForDisplay
        ),
      };
    case "availableAfterChanged":
      return {
        state: stateWithFieldEdit(
          state,
          event.key,
          "availableAfter",
          event.availableAfter
        ),
      };
    case "assetCreated":
      return onAssetCreated(state, event, deps);
    case "saveAccepted": {
      const openAsset = state.assets[event.key];
      if (!openAsset || openAsset.status !== "editingExistingAsset") {
        return { state };
      }
      return {
        state: stateWithOpenAsset(state, event.key, {
          ...openAsset,
          edits: openAsset.template
            ? clearUploadRegenerationFlags(openAsset.edits, openAsset.template)
            : openAsset.edits,
          saveState: "success",
        }),
      };
    }
    case "saveStarted": {
      const openAsset = state.assets[event.key];
      if (!openAsset || !hasAssetDocument(openAsset)) return { state };
      return {
        state: stateWithOpenAsset(state, event.key, {
          ...openAsset,
          saveState: "pending",
        }),
      };
    }
    case "saveFailed": {
      const openAsset = state.assets[event.key];
      if (!openAsset || !hasAssetDocument(openAsset)) return { state };
      return {
        state: stateWithOpenAsset(state, event.key, {
          ...openAsset,
          saveState: "error",
        }),
      };
    }
    case "resetRequested":
      return { state: initialEditorState };
    default:
      return assertNever(event);
  }
}

function stateWithOpenAsset(
  state: EditorState,
  key: EditSessionKey,
  openAsset: EditingAsset
): EditorState {
  return {
    ...state,
    assets: { ...state.assets, [key]: openAsset },
  };
}

/**
 * Opening a root asset retires the previous root: the page reuses one
 * editor across route changes, so nothing unmounts to close the old root.
 * The old root's inline children close themselves as their widgets
 * unmount.
 */
function stateWithAssetOpened(
  state: EditorState,
  key: EditSessionKey,
  openAsset: EditingAsset
): EditorState {
  if (openAsset.parentLink !== null) {
    return stateWithOpenAsset(state, key, openAsset);
  }
  const assetsWithoutOldRoot =
    state.rootKey === null ? state.assets : omit([state.rootKey], state.assets);
  return {
    assets: { ...assetsWithoutOldRoot, [key]: openAsset },
    rootKey: key,
  };
}

function onTemplateArrived(
  state: EditorState,
  event: { key: EditSessionKey; templateId: number; template: T.Template },
  deps: EditorDeps
): EditorState {
  const openAsset = state.assets[event.key];
  if (!openAsset) return state;

  if (
    openAsset.status === "awaitingTemplate" &&
    event.templateId === openAsset.templateId
  ) {
    return stateWithOpenAsset(state, event.key, {
      status: "editingNewAsset",
      parentLink: openAsset.parentLink,
      draft: makeNewLocalAsset({
        template: event.template,
        collectionId: openAsset.collectionId,
        createUuid: deps.createUuid,
      }),
      template: event.template,
      pendingTemplateId: null,
      saveState: "idle",
    });
  }

  if (!hasAssetDocument(openAsset)) return state;
  if (event.templateId !== openAsset.pendingTemplateId) return state;

  if (openAsset.status === "editingNewAsset") {
    return stateWithOpenAsset(state, event.key, {
      ...openAsset,
      draft: migrateAssetToTemplate(
        openAsset.draft,
        event.template,
        deps.createUuid
      ),
      template: event.template,
      pendingTemplateId: null,
    });
  }

  if (!openAsset.savedAsset) return state;
  const assetOnScreen = { ...openAsset.savedAsset, ...openAsset.edits };
  const migratedAsset = migrateAssetToTemplate(
    assetOnScreen,
    event.template,
    deps.createUuid
  );
  return stateWithOpenAsset(state, event.key, {
    ...openAsset,
    edits: diffEditableFields({
      draft: migratedAsset,
      savedAsset: openAsset.savedAsset,
      template: event.template,
    }),
    template: event.template,
    pendingTemplateId: null,
  });
}

function onTemplateLoadFailed(
  state: EditorState,
  event: { key: EditSessionKey; templateId: number; error: Error }
): EditorState {
  const openAsset = state.assets[event.key];
  if (!openAsset) return state;

  if (
    openAsset.status === "awaitingTemplate" &&
    event.templateId === openAsset.templateId
  ) {
    return stateWithOpenAsset(state, event.key, {
      status: "loadFailed",
      parentLink: openAsset.parentLink,
      error: event.error,
    });
  }

  // a failed migration clears its pending id and nothing else: the open
  // asset keeps its current template and stays editable, so a failed swap
  // cannot cost the user work in progress
  if (!hasAssetDocument(openAsset)) return state;
  if (event.templateId !== openAsset.pendingTemplateId) return state;
  return stateWithOpenAsset(state, event.key, {
    ...openAsset,
    pendingTemplateId: null,
  });
}

/**
 * Snapshot the arrived asset and template: put the raw asset into local
 * shape, keep every edit that still differs from it, and drop the edits it
 * made redundant.
 */
function onAssetAndTemplateArrived(
  state: EditorState,
  event: { key: EditSessionKey; asset: T.Asset; template: T.Template },
  deps: EditorDeps
): EditorState {
  const openAsset = state.assets[event.key];
  if (!openAsset || openAsset.status !== "editingExistingAsset") return state;
  if (event.asset.assetId !== openAsset.assetId) return state;

  const savedAsset = toLocalAsset({
    template: event.template,
    savedAsset: event.asset,
    previousAsset: openAsset.savedAsset,
    createUuid: deps.createUuid,
  });

  // while a migration is unsaved, the draft keeps rendering under its
  // migrated template even though the server's document still names the
  // old one
  const hasUnsavedMigration = typeof openAsset.edits.templateId === "number";
  const template = hasUnsavedMigration ? openAsset.template : event.template;

  return stateWithOpenAsset(state, event.key, {
    ...openAsset,
    savedAsset,
    template,
    edits: diffEditableFields({
      draft: { ...savedAsset, ...openAsset.edits },
      savedAsset,
      template: event.template,
    }),
  });
}

function stateWithFieldEdit(
  state: EditorState,
  key: EditSessionKey,
  fieldKey: string,
  value: unknown
): EditorState {
  const openAsset = state.assets[key];
  if (!openAsset || !hasAssetDocument(openAsset)) return state;
  switch (openAsset.status) {
    case "editingNewAsset":
      return stateWithOpenAsset(state, key, {
        ...openAsset,
        draft: { ...openAsset.draft, [fieldKey]: value },
      });
    case "editingExistingAsset":
      // an edit equal to the saved asset is not dropped here, because
      // dirtiness compares in stored shape anyway, and the next
      // assetAndTemplateArrived prunes redundant edits
      return stateWithOpenAsset(state, key, {
        ...openAsset,
        edits: { ...openAsset.edits, [fieldKey]: value },
      });
    default:
      return assertNever(openAsset);
  }
}

function onAssetCreated(
  state: EditorState,
  event: { key: EditSessionKey; assetId: string; sentAsset: T.UnsavedAsset },
  deps: EditorDeps
): EditorStep {
  const openAsset = state.assets[event.key];
  if (!openAsset || openAsset.status !== "editingNewAsset") {
    return {
      state,
      effects: [{ type: "notifyCreateDropped", assetId: event.assetId }],
    };
  }

  // typed as a stored asset even though `modified` is still null: that is
  // the one field the server assigns at store time, nothing reads it off a
  // saved asset, and the read-back replaces this document with the real one
  const sentDocument = {
    ...clearUploadRegenerationFlags(event.sentAsset, openAsset.template),
    assetId: event.assetId,
  } as unknown as T.Asset;
  const savedAsset = toLocalAsset({
    template: openAsset.template,
    savedAsset: sentDocument,
    previousAsset: openAsset.draft,
    createUuid: deps.createUuid,
  });

  // the draft loses its regeneration flags the same way the sent document
  // did, or they would read as edits made after the send
  const latestDraft = clearUploadRegenerationFlags(
    openAsset.draft,
    openAsset.template
  );

  let nextState = stateWithOpenAsset(state, event.key, {
    status: "editingExistingAsset",
    parentLink: openAsset.parentLink,
    assetId: event.assetId,
    savedAsset,
    template: openAsset.template,
    // anything typed while the create was in flight differs from the sent
    // snapshot and stays pending for the next save
    edits: diffEditableFields({
      draft: latestDraft,
      savedAsset,
      template: openAsset.template,
    }),
    pendingTemplateId: null,
    saveState: "success",
  });

  if (openAsset.parentLink) {
    nextState = stateWithTargetAssetIdFilled(
      nextState,
      openAsset.parentLink,
      event.assetId
    );
    return { state: nextState };
  }

  // only a root create notifies: the page reacts by moving to the new
  // asset's url, which an inline child must never trigger
  return {
    state: nextState,
    effects: [
      { type: "notifyAssetCreated", key: event.key, assetId: event.assetId },
    ],
  };
}

/**
 * Fill in the parent's related-asset item with the child's newly created
 * assetId. An item without one can only live in unsaved state, never in
 * the parent's saved asset, because the server drops related items whose
 * targetAssetId is empty.
 */
function stateWithTargetAssetIdFilled(
  state: EditorState,
  parentLink: ParentLink,
  assetId: string
): EditorState {
  const parent = state.assets[parentLink.key];
  if (!parent || !hasAssetDocument(parent)) return state;

  const parentFields =
    parent.status === "editingNewAsset" ? parent.draft : parent.edits;
  const contents = parentFields[parentLink.fieldTitle];
  if (!Array.isArray(contents)) return state;

  const isLinkedItem = matchesItemUuid(parentLink.itemUuid);
  if (!contents.some(isLinkedItem)) return state;

  const linkedContents = contents.map((item) =>
    isLinkedItem(item) ? { ...item, targetAssetId: assetId } : item
  );

  if (parent.status === "editingNewAsset") {
    return stateWithOpenAsset(state, parentLink.key, {
      ...parent,
      draft: { ...parent.draft, [parentLink.fieldTitle]: linkedContents },
    });
  }
  return stateWithOpenAsset(state, parentLink.key, {
    ...parent,
    edits: { ...parent.edits, [parentLink.fieldTitle]: linkedContents },
  });
}

function matchesItemUuid(itemUuid: string): (item: unknown) => boolean {
  return (item) =>
    typeof item === "object" &&
    item !== null &&
    (item as { uuid?: unknown }).uuid === itemUuid;
}

function assertNever(value: never): never {
  throw new Error(`Unhandled case in the editor: ${JSON.stringify(value)}`);
}
