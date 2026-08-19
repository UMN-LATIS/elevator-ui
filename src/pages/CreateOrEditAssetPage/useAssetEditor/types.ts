/**
 * The editor's type dictionary: its whole state, the events that change
 * that state, and the effects it asks for.
 *
 * The state holds one open asset for the page's own asset, and one more
 * for each inline related asset mounted under it. An open asset owns the
 * working set: the snapshots of the saved asset and template it was loaded
 * with, and the edits laid over them. Server truth stays in the TanStack
 * Query cache, and in-flight work stays in the effects layer.
 */

import * as T from "@/types";

/** Created once per opening of an asset, stable for that editor's life. */
export type EditSessionKey = string;

/**
 * The place an inline child occupies in its parent's document: the related-asset
 * item whose targetAssetId the child's create fills in.
 */
export interface ParentLink {
  key: EditSessionKey;
  fieldTitle: string;
  itemUuid: string;
}

/**
 * The overlay of unsaved work: each entry replaces one editable field of
 * the saved asset, last write wins. No edit in this app is finer than a
 * field.
 */
export type FieldEdits = Partial<T.Asset>;

/**
 * Where the open asset's latest save attempt stands. Matches TanStack
 * Query's MutationStatus values, which is the shape the save button
 * already reads.
 */
export type SaveState = "idle" | "pending" | "success" | "error";

export type EditingAsset =
  | {
      status: "awaitingTemplate";
      parentLink: ParentLink | null;
      collectionId: number;
      templateId: number;
    }
  | {
      status: "editingNewAsset";
      parentLink: ParentLink | null;
      /** the whole document: a draft has no server copy to diff against */
      draft: T.UnsavedAsset;
      /** a snapshot taken at load, swapped only by an accepted migration */
      template: T.Template;
      pendingTemplateId: number | null;
      saveState: SaveState;
    }
  | {
      status: "editingExistingAsset";
      parentLink: ParentLink | null;
      assetId: string;
      /**
       * a snapshot in local shape, with the uuids the UI needs created.
       * Null until the asset and its template arrive.
       */
      savedAsset: T.Asset | null;
      /**
       * The template the draft renders under. Usually the saved asset's,
       * but an unsaved migration snapshots the migration target here while
       * the saved asset keeps saying what the server has.
       */
      template: T.Template | null;
      edits: FieldEdits;
      pendingTemplateId: number | null;
      saveState: SaveState;
    }
  | { status: "loadFailed"; parentLink: ParentLink | null; error: Error };

export interface EditorState {
  rootKey: EditSessionKey | null;
  assets: Record<EditSessionKey, EditingAsset>;
}

export const initialEditorState: EditorState = {
  rootKey: null,
  assets: {},
};

export type AssetWithDocument = Extract<
  EditingAsset,
  { status: "editingNewAsset" | "editingExistingAsset" }
>;

/** An open asset's status, plus the case where the page has none open. */
export type EditorStatus = EditingAsset["status"] | "noAssetOpen";

export function hasAssetDocument(
  openAsset: EditingAsset
): openAsset is AssetWithDocument {
  return (
    openAsset.status === "editingNewAsset" ||
    openAsset.status === "editingExistingAsset"
  );
}

export type EditorEvent =
  | {
      type: "widgetContentsEdited";
      key: EditSessionKey;
      fieldTitle: T.WidgetDef["fieldTitle"];
      contents: T.WidgetContent[];
    }
  | {
      type: "uploadCompleted";
      key: EditSessionKey;
      fieldTitle: T.WidgetDef["fieldTitle"];
      contents: T.WidgetContent[];
    }
  | { type: "collectionChanged"; key: EditSessionKey; collectionId: number }
  | {
      type: "readyForDisplayChanged";
      key: EditSessionKey;
      readyForDisplay: boolean;
    }
  | {
      type: "availableAfterChanged";
      key: EditSessionKey;
      availableAfter: T.PHPDateTime | null;
    }
  | {
      type: "newAssetRequested";
      key: EditSessionKey;
      parentLink: ParentLink | null;
      collectionId: number;
      templateId: number;
    }
  | {
      type: "existingAssetRequested";
      key: EditSessionKey;
      parentLink: ParentLink | null;
      assetId: string;
    }
  | { type: "closed"; key: EditSessionKey }
  | {
      /**
       * A requested template arrived. What it means depends on what the
       * open asset is waiting for: a new draft builds its local shape from
       * it, and an open asset with a matching pending migration migrates
       * onto it.
       */
      type: "templateArrived";
      key: EditSessionKey;
      templateId: number;
      template: T.Template;
    }
  | {
      type: "templateLoadFailed";
      key: EditSessionKey;
      templateId: number;
      error: Error;
    }
  | {
      /**
       * The open asset's asset and template arrived: at open, and again as
       * each save's read-back. The raw asset is put into local shape and
       * snapshotted as the new saved asset, and edits the refresh made
       * redundant are dropped.
       */
      type: "assetAndTemplateArrived";
      key: EditSessionKey;
      asset: T.Asset;
      template: T.Template;
    }
  | { type: "assetLoadFailed"; key: EditSessionKey; error: Error }
  | {
      type: "templateMigrationRequested";
      key: EditSessionKey;
      templateId: number;
    }
  | {
      /**
       * The server accepted a create. The submission response carries only
       * the new id, so `sentAsset` is the snapshot the save sent, and the
       * open asset's saved asset becomes that snapshot stamped with the id:
       * the server stored what we sent, and the read-back that follows as
       * assetAndTemplateArrived corrects whatever the server changed in
       * storing it. Committing the id here, before any read-back, is what
       * makes a retry after a failed read-back update instead of create
       * again.
       */
      type: "assetCreated";
      key: EditSessionKey;
      assetId: string;
      sentAsset: T.UnsavedAsset;
    }
  | {
      /**
       * The server accepted an update save. The read-back arrives
       * separately as assetAndTemplateArrived. This event only retires
       * client-only state the save has now delivered.
       */
      type: "saveAccepted";
      key: EditSessionKey;
    }
  | { type: "saveStarted"; key: EditSessionKey }
  | { type: "saveFailed"; key: EditSessionKey }
  | { type: "resetRequested" };

/** An effect the reducer asks the effect runner to run. */
export type EditorEffect =
  | {
      type: "fetchAssetAndTemplate";
      key: EditSessionKey;
      assetId: string;
    }
  | { type: "fetchTemplate"; key: EditSessionKey; templateId: number }
  | {
      /**
       * Save this open asset. The uploaded file already exists on the
       * server, so an asset that does not reference it leaves it orphaned.
       */
      type: "requestSave";
      key: EditSessionKey;
    }
  | { type: "notifyAssetCreated"; key: EditSessionKey; assetId: string }
  | {
      /**
       * A create response arrived for an open asset that no longer holds
       * its draft. The asset exists with nothing pointing at it, which the
       * user must hear.
       */
      type: "notifyCreateDropped";
      assetId: string;
    };

/** The impure needs, injected so the reducer stays deterministic. */
export interface EditorDeps {
  createUuid: () => string;
}

export interface EditorStep {
  state: EditorState;
  effects?: EditorEffect[];
}

export type Dispatch<Event> = (event: Event) => void;
