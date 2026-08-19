/**
 * Reads over the editor state. Every derived value a component needs comes
 * from one of these, so the state's shape stays private to this directory.
 */

import * as T from "@/types";
import {
  EditSessionKey,
  EditingAsset,
  EditorState,
  EditorStatus,
  SaveState,
  hasAssetDocument,
} from "./types";
import { makeNewLocalAsset, wouldSaveChangeStoredAsset } from "./localAsset";

export function selectOpenAsset(
  state: EditorState,
  key: EditSessionKey | null
): EditingAsset | null {
  if (key === null) return null;
  return state.assets[key] ?? null;
}

export function selectStatus(
  state: EditorState,
  key: EditSessionKey | null
): EditorStatus {
  return selectOpenAsset(state, key)?.status ?? "noAssetOpen";
}

export function selectAssetId(
  state: EditorState,
  key: EditSessionKey | null
): string | null {
  const openAsset = selectOpenAsset(state, key);
  return openAsset?.status === "editingExistingAsset"
    ? openAsset.assetId
    : null;
}

/**
 * The asset as the user sees it: the saved asset's snapshot with pending
 * edits laid over it, or the draft itself. Null while the open asset holds
 * no document.
 */
export function selectLocalAsset(
  state: EditorState,
  key: EditSessionKey | null
): T.Asset | T.UnsavedAsset | null {
  const openAsset = selectOpenAsset(state, key);
  if (!openAsset) return null;
  switch (openAsset.status) {
    case "editingNewAsset":
      return openAsset.draft;
    case "editingExistingAsset":
      if (!openAsset.savedAsset) return null;
      return { ...openAsset.savedAsset, ...openAsset.edits };
    default:
      return null;
  }
}

/** The document as the server last returned it, null before a first save. */
export function selectSavedAsset(
  state: EditorState,
  key: EditSessionKey | null
): T.Asset | null {
  const openAsset = selectOpenAsset(state, key);
  return openAsset?.status === "editingExistingAsset"
    ? openAsset.savedAsset
    : null;
}

export function selectLoadError(
  state: EditorState,
  key: EditSessionKey | null
): Error | null {
  const openAsset = selectOpenAsset(state, key);
  return openAsset?.status === "loadFailed" ? openAsset.error : null;
}

/**
 * The template the open asset's draft renders under, snapshotted in the
 * state.
 */
export function selectTemplate(
  state: EditorState,
  key: EditSessionKey | null
): T.Template | null {
  const openAsset = selectOpenAsset(state, key);
  if (!openAsset || !hasAssetDocument(openAsset)) return null;
  return openAsset.template;
}

export function selectTemplateId(
  state: EditorState,
  key: EditSessionKey | null
): number | null {
  const openAsset = selectOpenAsset(state, key);
  if (!openAsset) return null;
  if (openAsset.status === "awaitingTemplate") return openAsset.templateId;
  if (!hasAssetDocument(openAsset)) return null;
  return openAsset.template?.templateId ?? null;
}

export function selectSaveState(
  state: EditorState,
  key: EditSessionKey | null
): SaveState {
  const openAsset = selectOpenAsset(state, key);
  if (!openAsset || !hasAssetDocument(openAsset)) return "idle";
  return openAsset.saveState;
}

/**
 * Whether this one open asset's own edits would change its stored asset.
 * Children are excluded, walk them with selectKeyAndDescendants.
 * Reads as clean while the asset and its template are still loading.
 */
export function selectHasUnsavedEdits(
  state: EditorState,
  key: EditSessionKey | null
): boolean {
  const openAsset = selectOpenAsset(state, key);
  if (!openAsset || !hasAssetDocument(openAsset)) return false;
  switch (openAsset.status) {
    case "editingNewAsset":
      // an untouched draft is not unsaved work, or the leave guard would
      // nag on a create page the user never typed into
      return wouldSaveChangeStoredAsset({
        draft: openAsset.draft,
        savedAsset: makeNewLocalAsset({
          template: openAsset.template,
          collectionId: openAsset.draft.collectionId,
          // dirtiness compares in stored shape, where uuids are stripped,
          // so the untouched local shape's uuids never matter
          createUuid: () => "",
        }),
        template: openAsset.template,
      });
    case "editingExistingAsset": {
      const assetOnScreen = selectLocalAsset(state, key);
      if (!assetOnScreen || !openAsset.savedAsset || !openAsset.template) {
        return false;
      }
      // `edits` may hold differences the server would never store, like a
      // newly added blank item, so dirtiness is measured against what a
      // save would actually change
      return wouldSaveChangeStoredAsset({
        draft: assetOnScreen,
        savedAsset: openAsset.savedAsset,
        template: openAsset.template,
      });
    }
    default:
      return assertNever(openAsset);
  }
}

/**
 * The open asset and everything mounted under it, following parentLink
 * edges. The visited set terminates cycles: asset A relating to B relating
 * back to A can both be open at once.
 */
export function selectKeyAndDescendants(
  state: EditorState,
  key: EditSessionKey
): EditSessionKey[] {
  const visited = new Set<EditSessionKey>();
  const queue: EditSessionKey[] = [key];
  while (queue.length > 0) {
    const nextKey = queue.shift() as EditSessionKey;
    if (visited.has(nextKey) || !state.assets[nextKey]) continue;
    visited.add(nextKey);
    Object.entries(state.assets).forEach(([childKey, child]) => {
      if (child.parentLink?.key === nextKey) queue.push(childKey);
    });
  }
  return [...visited];
}

/** The keys of the open asset's direct children, in state insertion order. */
export function selectChildKeys(
  state: EditorState,
  key: EditSessionKey
): EditSessionKey[] {
  return Object.entries(state.assets)
    .filter(([, openAsset]) => openAsset.parentLink?.key === key)
    .map(([childKey]) => childKey);
}

function assertNever(value: never): never {
  throw new Error(`Unhandled case in the editor: ${JSON.stringify(value)}`);
}
