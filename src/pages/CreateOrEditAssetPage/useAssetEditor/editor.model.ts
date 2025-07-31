// editor.model.ts (pure)
// Keep this file free of any Vue imports.
import type {
  Asset,
  UnsavedAsset,
  Template,
  ApiAssetSubmissionResponse,
} from "@/types";
import {
  makeLocalAsset,
  doAllRequiredHaveContent,
  hasAssetChanged as hasAssetChangedPure,
} from "./utils";

export type EditorStatus =
  | "idle"
  | "initializing"
  | "editing"
  | "saving"
  | "error"
  | "done";

export interface EditorState {
  status: EditorStatus;
  localAsset: Asset | UnsavedAsset | null;
  savedAsset: Asset | null;
  template: Template | null;
  selectedTemplateId: number | "";
  selectedCollectionId: number | "";
  isDirty: boolean;
  isValid: boolean;
  error?: string;
}

export type EditorEvent =
  | { type: "INIT" }
  | { type: "LOAD_SAVED_ASSET_SUCCESS"; saved: Asset | null }
  | { type: "LOAD_TEMPLATE_SUCCESS"; template: Template }
  | { type: "SET_TEMPLATE"; id: number }
  | { type: "SET_COLLECTION"; id: number }
  | { type: "CONTINUE_TO_EDIT"; templateId: number; collectionId: number }
  | { type: "UPDATE_LOCAL_ASSET"; asset: Asset | UnsavedAsset }
  | { type: "REQUEST_SAVE" }
  | { type: "SAVE_SUCCESS"; saved: ApiAssetSubmissionResponse }
  | { type: "SAVE_FAILURE"; message: string }
  | { type: "RESET" };

export type Effect = { kind: "save" } | { kind: "none" };

/**
 * Creates the initial editor state
 *
 * @returns Fresh editor state for a new session
 */
export const initialState = (): EditorState => ({
  status: "idle",
  localAsset: null,
  savedAsset: null,
  template: null,
  selectedTemplateId: "",
  selectedCollectionId: "",
  isDirty: false,
  isValid: false,
});

/**
 * Pure reducer function - handles all state transitions
 *
 * @param state - Current editor state
 * @param event - Action event to process
 * @returns Tuple of [nextState, effect] - effect describes what side effects should run
 */
export function reduce(
  state: EditorState,
  event: EditorEvent
): [EditorState, Effect] {
  switch (event.type) {
    case "INIT":
      return [{ ...state, status: "initializing" }, { kind: "none" }];

    case "LOAD_SAVED_ASSET_SUCCESS": {
      const saved = event.saved ?? null;
      // If we have a saved asset, extract its template and collection IDs
      const nextState = {
        ...state,
        savedAsset: saved,
        selectedTemplateId: saved?.templateId ?? state.selectedTemplateId,
        selectedCollectionId: saved?.collectionId ?? state.selectedCollectionId,
      };
      return [nextState, { kind: "none" }];
    }

    case "LOAD_TEMPLATE_SUCCESS": {
      const template = event.template;

      // Determine the effective collection ID
      const selected = state.selectedCollectionId;
      const effectiveCollectionId =
        (selected === "" ? null : selected) ??
        state.savedAsset?.collectionId ??
        1; // fallback to first collection

      // Create the local asset from template + saved data
      const local = makeLocalAsset({
        template,
        collectionId: effectiveCollectionId,
        savedAsset: state.savedAsset,
      });

      const isValid = doAllRequiredHaveContent(local, template);
      const isDirty = state.savedAsset
        ? hasAssetChangedPure({
            localAsset: local,
            savedAsset: state.savedAsset,
            template,
          })
        : false;

      return [
        {
          ...state,
          template,
          localAsset: local,
          status: "editing",
          isDirty,
          isValid,
          selectedCollectionId: effectiveCollectionId,
        },
        { kind: "none" },
      ];
    }

    case "SET_TEMPLATE": {
      // Always update selectedTemplateId, even without localAsset (create mode)
      if (!state.localAsset) {
        return [
          {
            ...state,
            selectedTemplateId: event.id,
          },
          { kind: "none" },
        ];
      }

      // If we have localAsset, update it too
      const next = { ...state.localAsset, templateId: event.id };
      const isValid = state.template
        ? doAllRequiredHaveContent(next, state.template)
        : false;
      const isDirty =
        state.savedAsset && state.template
          ? hasAssetChangedPure({
              localAsset: next,
              savedAsset: state.savedAsset,
              template: state.template,
            })
          : true;

      return [
        {
          ...state,
          selectedTemplateId: event.id,
          localAsset: next,
          isDirty,
          isValid,
        },
        { kind: "none" },
      ];
    }

    case "SET_COLLECTION": {
      if (!state.localAsset) {
        // If no local asset yet, just update the selected collection
        return [
          {
            ...state,
            selectedCollectionId: event.id,
          },
          { kind: "none" },
        ];
      }

      const next = { ...state.localAsset, collectionId: event.id };
      const isValid = state.template
        ? doAllRequiredHaveContent(next, state.template)
        : false;
      const isDirty =
        state.savedAsset && state.template
          ? hasAssetChangedPure({
              localAsset: next,
              savedAsset: state.savedAsset,
              template: state.template,
            })
          : true;

      return [
        {
          ...state,
          selectedCollectionId: event.id,
          localAsset: next,
          isDirty,
          isValid,
        },
        { kind: "none" },
      ];
    }

    case "UPDATE_LOCAL_ASSET": {
      const next = event.asset;
      const isDirty =
        state.savedAsset && state.template
          ? hasAssetChangedPure({
              localAsset: next,
              savedAsset: state.savedAsset,
              template: state.template,
            })
          : true;
      const isValid = state.template
        ? doAllRequiredHaveContent(next, state.template)
        : false;

      return [
        {
          ...state,
          localAsset: next,
          isDirty,
          isValid,
        },
        { kind: "none" },
      ];
    }

    case "REQUEST_SAVE": {
      if (!state.isValid || !state.localAsset || !state.template) {
        return [state, { kind: "none" }];
      }
      return [{ ...state, status: "saving" }, { kind: "save" }];
    }

    case "SAVE_SUCCESS": {
      // If create mode, update local asset ID
      let local = state.localAsset;
      if (local && !("assetId" in local) && event.saved.objectId) {
        local = {
          ...(local as UnsavedAsset),
          assetId: event.saved.objectId,
        } as Asset;
      }

      return [
        {
          ...state,
          status: "editing",
          savedAsset: local as Asset,
          localAsset: local,
          isDirty: false,
          error: undefined,
        },
        { kind: "none" },
      ];
    }

    case "SAVE_FAILURE":
      return [
        {
          ...state,
          status: "error",
          error: event.message,
        },
        { kind: "none" },
      ];

    case "RESET":
      return [initialState(), { kind: "none" }];

    default:
      return [state, { kind: "none" }];
  }
}
