/**
 * The editor's effect runner: the only place the editor talks to the
 * network. It executes what the reducer asked for and dispatches the
 * results back as events. It holds no state a component reads and makes no
 * decisions of its own: if something here wants to branch on the state,
 * that branch belongs in the reducer.
 */

import * as T from "@/types";
import * as fetchers from "@/api/fetchers";
import { QueryClient } from "@tanstack/vue-query";
import invariant from "tiny-invariant";
import { assetQuery } from "@/queries/useAssetQuery";
import { templateQuery } from "@/queries/templateQueries";
import {
  Dispatch,
  EditSessionKey,
  EditorEffect,
  EditorEvent,
  EditorState,
  hasAssetDocument,
} from "./types";
import {
  selectChildKeys,
  selectHasUnsavedEditsInTree,
  selectLocalAsset,
  selectTemplate,
} from "./selectors";
import { createSaveQueue } from "./createSaveQueue";
import { toSaveableFormData } from "./toSaveableFormData";

/**
 * What the page wants to hear about. These fire for work no caller is
 * awaiting: an upload's auto-save, a child saved inside a parent's save,
 * a create that resolved after its editor moved on.
 */
export interface EditorPageHandlers {
  onAssetCreated: (assetId: string) => void;
  onChildSaveFailed: (error: unknown) => void;
  onCreateDropped: () => void;
  onUploadSaveFailed: (error: unknown) => void;
}

export interface EffectRunnerOptions {
  queryClient: QueryClient;
  getState: () => EditorState;
  dispatch: Dispatch<EditorEvent>;
  handlers: EditorPageHandlers;
}

export type SaveQueue = ReturnType<typeof createSaveQueue>;

interface Settlement {
  resolve: () => void;
  reject: (error: unknown) => void;
}

export function createEffectRunner({
  queryClient,
  getState,
  dispatch,
  handlers,
}: EffectRunnerOptions) {
  const saveQueues = new Map<EditSessionKey, SaveQueue>();

  // callers awaiting a fetch the reducer requested, keyed by what settles
  // them. The fetch always settles its waiters, even when the reducer
  // drops the result because the open asset closed meanwhile.
  const settlements = new Map<string, Settlement[]>();

  function runEffect(effect: EditorEffect): void {
    switch (effect.type) {
      case "fetchAssetAndTemplate":
        void fetchAssetAndTemplate(effect.key, effect.assetId);
        return;
      case "fetchTemplate":
        void fetchTemplate(effect.key, effect.templateId);
        return;
      case "requestSave":
        // the only reducer-requested save is an upload's auto-save, so
        // nothing is awaiting it and a failure goes to the page instead
        saveQueueFor(effect.key)
          .save()
          .catch((error) => handlers.onUploadSaveFailed(error));
        return;
      case "notifyAssetCreated":
        handlers.onAssetCreated(effect.assetId);
        return;
      case "notifyCreateDropped":
        handlers.onCreateDropped();
        return;
      default:
        assertNever(effect);
    }
  }

  function waitFor(settlementKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const waiting = settlements.get(settlementKey) ?? [];
      settlements.set(settlementKey, [...waiting, { resolve, reject }]);
    });
  }

  function settle(settlementKey: string, error?: unknown): void {
    const waiting = settlements.get(settlementKey) ?? [];
    settlements.delete(settlementKey);
    waiting.forEach((settlement) => {
      if (error === undefined) settlement.resolve();
      else settlement.reject(error);
    });
  }

  async function fetchAssetAndTemplate(
    key: EditSessionKey,
    assetId: string
  ): Promise<void> {
    try {
      const { asset, template } = await fetchAssetAndTemplateFromServer(
        assetId
      );
      dispatch({ type: "assetAndTemplateArrived", key, asset, template });
      settle(assetAndTemplateSettlementKey(key));
    } catch (error) {
      dispatch({ type: "assetLoadFailed", key, error: asError(error) });
      settle(assetAndTemplateSettlementKey(key), error);
    }
  }

  async function fetchTemplate(
    key: EditSessionKey,
    templateId: number
  ): Promise<void> {
    try {
      const template = await queryClient.fetchQuery({
        ...templateQuery(templateId),
        staleTime: 0,
      });
      invariant(template, `template ${templateId} came back empty`);
      dispatch({ type: "templateArrived", key, templateId, template });
      settle(templateSettlementKey(key, templateId));
    } catch (error) {
      dispatch({
        type: "templateLoadFailed",
        key,
        templateId,
        error: asError(error),
      });
      settle(templateSettlementKey(key, templateId), error);
    }
  }

  /**
   * The editor's saves replace the whole stored document, so a stale
   * starting point would overwrite whatever changed on the server since it
   * was cached. The asset and its template always come from the server,
   * not the cache, and the cache is written through for the rest of the
   * app.
   */
  async function fetchAssetAndTemplateFromServer(
    assetId: string
  ): Promise<{ asset: T.Asset; template: T.Template }> {
    const asset = await queryClient.fetchQuery({
      ...assetQuery(assetId),
      staleTime: 0,
    });
    invariant(asset, `asset ${assetId} came back empty`);
    const template = await queryClient.fetchQuery({
      ...templateQuery(asset.templateId),
      staleTime: 0,
    });
    invariant(template, `template ${asset.templateId} came back empty`);
    return { asset, template };
  }

  function saveQueueFor(key: EditSessionKey): SaveQueue {
    const existing = saveQueues.get(key);
    if (existing) return existing;
    const queue = createSaveQueue(() => runSave(key));
    saveQueues.set(key, queue);
    return queue;
  }

  /**
   * One whole save round trip. It runs inside the open asset's queue, and
   * the read-back runs inside it too, so the queue only releases once the
   * saved asset reflects this save: saved asset order equals save order by
   * construction.
   */
  async function runSave(key: EditSessionKey): Promise<void> {
    const stateAtStart = getState();
    const openAssetAtStart = stateAtStart.assets[key];
    if (!openAssetAtStart || !hasAssetDocument(openAssetAtStart)) return;
    dispatch({ type: "saveStarted", key });

    // dirty children save first, each through its own queue. allSettled so
    // one child's failure cannot cost this asset's edits, and a child's
    // create commits its id into the state before the snapshot is taken.
    //
    // A child is worth saving when anything in its subtree is dirty, not
    // just the child itself, so that a dirty grandchild under a clean child
    // still reaches the server. Its own runSave applies the same rule, so
    // the walk carries on down.
    const dirtyChildKeys = selectChildKeys(stateAtStart, key).filter(
      (childKey) => selectHasUnsavedEditsInTree(stateAtStart, childKey)
    );
    const childResults = await Promise.allSettled(
      dirtyChildKeys.map((childKey) => saveQueueFor(childKey).save())
    );
    childResults.forEach((result) => {
      if (result.status === "rejected") {
        handlers.onChildSaveFailed(result.reason);
      }
    });

    const state = getState();
    const openAsset = state.assets[key];
    // the editor was torn down, or its asset went back to loading or gave
    // up loading. None of those statuses carry a saveState, so nothing is
    // left pending and there is nobody on screen to tell.
    if (!openAsset || !hasAssetDocument(openAsset)) return;

    const template = selectTemplate(state, key);
    const snapshot = selectLocalAsset(state, key);
    if (!template || !snapshot) {
      // saveStarted already moved this asset to pending and only a dispatch
      // moves it back, so returning quietly would leave the spinner up and
      // the Save button disabled for good.
      dispatch({ type: "saveFailed", key });
      throw new Error(
        `asset ${key} had no template or no saved document to build a save from`
      );
    }

    try {
      if (openAsset.status === "editingNewAsset") {
        const response = await fetchers.createAsset({
          ...toSaveableFormData(openAsset.draft, template),
          objectId: "",
        });
        dispatch({
          type: "assetCreated",
          key,
          assetId: response.objectId,
          sentAsset: openAsset.draft,
        });
        await readBack(key, response.objectId);
      } else {
        await fetchers.updateAsset(toSaveableFormData(snapshot, template));
        dispatch({ type: "saveAccepted", key });
        await readBack(key, openAsset.assetId);
      }
    } catch (error) {
      dispatch({ type: "saveFailed", key });
      throw error;
    }
  }

  async function readBack(key: EditSessionKey, assetId: string): Promise<void> {
    try {
      const { asset, template } = await fetchAssetAndTemplateFromServer(
        assetId
      );
      dispatch({ type: "assetAndTemplateArrived", key, asset, template });
    } catch {
      // an accepted save with a failed read-back is still an accepted
      // save. The saved asset stays the document this save sent, and the
      // next save or reload corrects it.
    }
  }

  return {
    runEffect,
    saveQueueFor,
    /** Settles when the fetch behind an existingAssetRequested settles. */
    whenAssetAndTemplateSettles(key: EditSessionKey): Promise<void> {
      return waitFor(assetAndTemplateSettlementKey(key));
    },
    /** Settles when the fetch behind a template request settles. */
    whenTemplateSettles(
      key: EditSessionKey,
      templateId: number
    ): Promise<void> {
      return waitFor(templateSettlementKey(key, templateId));
    },
  };
}

export type EffectRunner = ReturnType<typeof createEffectRunner>;

function assetAndTemplateSettlementKey(key: EditSessionKey): string {
  return `assetAndTemplate:${key}`;
}

function templateSettlementKey(
  key: EditSessionKey,
  templateId: number
): string {
  return `template:${key}:${templateId}`;
}

function asError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

function assertNever(value: never): never {
  throw new Error(`Unhandled editor effect: ${JSON.stringify(value)}`);
}
