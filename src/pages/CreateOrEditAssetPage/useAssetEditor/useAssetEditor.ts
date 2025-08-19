import * as T from "@/types";
import { MutationStatus } from "@tanstack/vue-query";
import { computed, reactive, toRefs } from "vue";
import { useInstanceStore } from "@/stores/instanceStore";
import {
  hasAssetChanged as hasAssetChangedPure,
  makeLocalAsset,
  toSaveableFormData,
} from "./utils";
import * as validation from "./validation";
import invariant from "tiny-invariant";
import * as fetchers from "@/api/fetchers";

interface AssetEditorState {
  editorId: string; // unique ID for this editor instance
  localAsset: T.Asset | T.UnsavedAsset | null;
  savedAsset: T.Asset | null;
  template: T.Template | null;
  isInitialized: boolean;
  saveAssetStatus: MutationStatus;
  modifiedInlineRelatedAssetWidgets: Set<T.Asset["assetId"]>;
  isTemplateLoading?: boolean;
}

export interface TocItem {
  id: string;
  label: string;
  isRequired?: boolean;
  hasContent?: boolean;
  isValid?: boolean;
}

const initState = (opts?: Partial<AssetEditorState>): AssetEditorState => ({
  editorId: crypto.randomUUID(),
  localAsset: null,
  savedAsset: null,
  template: null,
  isInitialized: false,
  saveAssetStatus: "idle",
  isTemplateLoading: false,

  // inline related assets are part of this local asset
  // so we track widgets that have changed here
  modifiedInlineRelatedAssetWidgets: new Set(),
  ...opts,
});

/**
 * Provides a reactive asset editor state and methods to manage the asset lifecycle
 * Note that each instance of this composable has
 * its own state, so that it can be used in inline related
 * assets without affecting the main asset editor.
 * Use provide/inject to share state with child components.
 */
export const useAssetEditor = () => {
  const state = reactive<AssetEditorState>(initState());

  const assetId = computed(
    (): T.Asset["assetId"] | null => state.localAsset?.assetId ?? null
  );

  const instanceStore = useInstanceStore();

  ////////////////////////////////////////////////
  // COMPUTED

  const collectionOptions = computed((): T.SelectOption<number>[] => {
    const collections = instanceStore.collections ?? [];
    return collections.map((collection) => ({
      label: collection.title,
      id: collection.id,
    }));
  });

  const templateOptions = computed((): T.SelectOption<number>[] => {
    const templates = instanceStore.instance.templates ?? [];
    return templates.map((template) => ({
      label: template.name,
      id: template.id,
    }));
  });

  const savedAssetTitle = computed(
    () => state.savedAsset?.title?.[0] ?? state.savedAsset?.assetId ?? ""
  );

  const localAssetTitle = computed(() => {
    if (!state.localAsset) return "";
    const localTitle = state.localAsset.title?.[0];

    // if there's no title set, try the title widget
    const titleWidget =
      (state.localAsset.title_1 as T.TextWidgetContent[]) || [];
    const localTitleWidgetContent = titleWidget?.[0]?.fieldContents;

    return localTitle || localTitleWidgetContent || "";
  });

  const hasAssetChanged = computed(() => {
    if (!state.localAsset || !state.template) return false;

    const hasLocalAssetChanged = hasAssetChangedPure({
      localAsset: state.localAsset,
      savedAsset: state.savedAsset,
      template: state.template,
    });

    // do have any modified inline related assets?
    const haveInlineRelatedAssetsChanged =
      state.modifiedInlineRelatedAssetWidgets.size > 0;
    return hasLocalAssetChanged || haveInlineRelatedAssetsChanged;
  });

  const isFormValid = computed(() => {
    if (!state.localAsset || !state.template) return false;
    return validation.isFormValid(state.localAsset, state.template);
  });

  const widgetIdsWithContent = computed((): T.WidgetDef["widgetId"][] => {
    if (!state.template || !state.localAsset) return [];

    return state.template.widgetArray
      .filter((widgetDef) => {
        const widgetContents = (state.localAsset?.[widgetDef.fieldTitle] ??
          []) as T.WithId<T.WidgetContent>[];
        const widgetValidation = validation.validateWidget(
          widgetDef,
          widgetContents
        );
        return widgetValidation.hasContent;
      })
      .map((widgetDef) => widgetDef.widgetId);
  });

  // NOTE: unchecked checkbox widgets are considered content,
  // So, if the asset contains any, the widget will not be considered blank.
  const isBlank = computed((): boolean => {
    if (!state.localAsset || !state.template) return true;

    const someWidgetHasContent = state.template.widgetArray.some(
      (widgetDef) => {
        const widgetContents = (state.localAsset?.[widgetDef.fieldTitle] ??
          []) as T.WithId<T.WidgetContent>[];
        const widgetValidation = validation.validateWidget(
          widgetDef,
          widgetContents
        );
        return widgetValidation.hasContent;
      }
    );

    return !someWidgetHasContent;
  });

  const missingRequiredFields = computed((): string[] => {
    if (!state.localAsset || !state.template) return [];
    return validation.getMissingRequiredFields(
      state.localAsset,
      state.template
    );
  });

  const invalidFields = computed((): string[] => {
    if (!state.localAsset || !state.template) return [];
    return validation.getInvalidFields(state.localAsset, state.template);
  });

  const tocItems = computed((): TocItem[] => {
    if (!state.template || !state.localAsset) {
      return [];
    }
    return state.template.widgetArray
      .toSorted((a, b) => a.templateOrder - b.templateOrder)
      .map((widgetDef: T.WidgetDef) => {
        const id = getWidgetInstanceId(widgetDef.widgetId);
        const widgetContents = (state.localAsset?.[widgetDef.fieldTitle] ??
          []) as T.WithId<T.WidgetContent>[];
        const widgetValidation = validation.validateWidget(
          widgetDef,
          widgetContents
        );

        const tocItem: TocItem = {
          id,
          label: widgetDef.label,
          hasContent: widgetValidation.hasContent,
          isRequired: widgetDef.required,
          isValid: widgetValidation.isValid,
        };

        return tocItem;
      });
  });

  ////////////////////////////////////////////////
  // ACTIONS

  const getWidgetInstanceId = (
    widgetId: T.WidgetDef["widgetId"]
  ): T.WidgetInstanceId => `${state.editorId}-${widgetId}`;

  /**
   * Reset the state to initial values
   */
  function reset() {
    Object.assign(state, initState());
  }

  /**
   * Initialize a new asset based on a template and collection
   */
  async function initNewAsset({
    templateId,
    collectionId,
  }: {
    templateId: number;
    collectionId: number;
  }): Promise<void> {
    state.isInitialized = false;
    state.isTemplateLoading = true;
    const template = await fetchers.fetchTemplate(templateId);
    state.isTemplateLoading = false;
    invariant(
      template,
      `Cannot initialize new asset: no template found with id ${templateId}`
    );

    state.template = template;

    state.localAsset = makeLocalAsset({
      template,
      collectionId,
      savedAsset: null,
    });

    state.isInitialized = true;
  }

  /**
   * Initialize the editor with an existing asset by its ID
   */
  async function initExistingAsset(
    assetId: T.Asset["assetId"],
    opts: { force?: boolean } = {}
  ): Promise<void> {
    if (state.localAsset?.assetId === assetId && !opts.force) {
      return;
    }

    state.savedAsset = await fetchers.fetchAsset(assetId);

    const templateId = state.savedAsset?.templateId ?? null;
    invariant(templateId, "no templateId on saved asset");

    // only fetch a new template if it's not the current one
    if (state.template?.templateId !== templateId) {
      state.template = await fetchers.fetchTemplate(templateId);
    }

    invariant(
      state.template,
      `cannot setAssetId: no template with id ${templateId}`
    );

    const collectionId = state.savedAsset?.collectionId ?? null;
    invariant(collectionId, "no collectionId on saved asset");

    state.localAsset = makeLocalAsset({
      template: state.template,
      collectionId,
      savedAsset: state.savedAsset,
    });

    state.isInitialized = true;
  }

  /**
   * Reload the current asset from the backend (if it has an assetId)
   */
  async function refreshAsset(): Promise<void> {
    invariant(state.localAsset?.assetId, "Cannot refresh: no assetId");
    return initExistingAsset(state.localAsset.assetId, { force: true });
  }

  /**
   * Save the current local asset to the backend
   */
  async function saveAsset(): Promise<void> {
    invariant(state.localAsset, "Cannot save: no local asset");
    invariant(state.template, "Cannot save: no template");
    invariant(
      state.localAsset.templateId === state.template.templateId,
      "Cannot save: localAsset.templateId !== template.templateId"
    );

    if (state.saveAssetStatus === "pending") {
      // TODO: if already saving, wait until the current save is done? and return that promise?
      // For now, just log a warning
      console.warn("Already saving asset, waiting for current save to finish.");
    }

    state.saveAssetStatus = "pending";
    try {
      await runBeforeSaveCallbacks();

      const formData = toSaveableFormData(state.localAsset, state.template);

      const { objectId } = await fetchers.updateAsset(formData);
      invariant(objectId, "Expected objectId to be defined after saveAsset");

      const savedAsset = await fetchers.fetchAsset(objectId);
      invariant(
        savedAsset,
        "Expected saved asset to be defined after saveAsset"
      );

      state.savedAsset = savedAsset;

      // make some targeted updates to the local asset to avoid unnecessary reactivity
      state.localAsset.assetId = savedAsset.assetId;
      state.localAsset.title = savedAsset.title;
      state.localAsset.modified = savedAsset.modified;
      state.localAsset.modifiedBy = savedAsset.modifiedBy;
      state.localAsset.firstFileHandlerId = savedAsset.firstFileHandlerId;

      state.saveAssetStatus = "success";
      setTimeout(() => {
        state.saveAssetStatus = "idle"; // Reset status after a delay
      }, 3000);
    } catch (err) {
      console.error(`Cannot save asset: ${err}`);

      state.saveAssetStatus = "error";

      setTimeout(() => {
        state.saveAssetStatus = "idle"; // Reset status after a delay
      }, 10000);

      throw err;
    }
  }

  async function updateCollection(newCollectionId: number): Promise<void> {
    invariant(state.localAsset, "Cannot change collection: no local asset.");
    invariant(state.template, "Cannot change collection: no current template.");
    state.localAsset.collectionId = newCollectionId;

    // component should handle the saving and redirecting
  }

  /**
   * update the template in the state, and migrates the current local asset
   * to the new template.
   */
  async function migrateToTemplate(newTemplateId: number): Promise<void> {
    invariant(state.localAsset, "Cannot change template: no local asset.");
    invariant(state.template, "Cannot change template: no current template.");

    if (
      // if all templateIds are the same, return the current template
      state.template.templateId === newTemplateId &&
      state.localAsset.templateId === newTemplateId
    ) {
      return;
    }

    state.isTemplateLoading = true;
    const newTemplate = await fetchers.fetchTemplate(newTemplateId);
    invariant(
      newTemplate,
      `Cannot update templateId: no template found with id ${newTemplateId}`
    );

    state.template = newTemplate;
    state.isTemplateLoading = false;

    if (!state.localAsset) {
      return;
    }

    // if we have a local asset,  migrate it
    const defaultAsset = makeLocalAsset({
      template: newTemplate,
      collectionId: state.localAsset.collectionId,
      savedAsset: null,
    });

    state.localAsset = {
      ...defaultAsset,
      ...state.localAsset,
      templateId: newTemplate.templateId, // Ensure the templateId is updated
    };

    // component should handle the saving
  }

  async function updateLocalAsset(
    updatedAsset: T.UnsavedAsset | T.Asset
  ): Promise<void> {
    invariant(state.localAsset, "Cannot update asset: no local asset.");

    // If the templateId has changed, we need to update the template
    // and migrate the asset
    if (state.localAsset.templateId !== updatedAsset.templateId) {
      await migrateToTemplate(updatedAsset.templateId);
    }

    state.localAsset = updatedAsset;
  }

  function updateAssetField(
    field: keyof T.UnsavedAsset,
    value: T.UnsavedAsset[keyof T.UnsavedAsset]
  ): void {
    invariant(state.localAsset, "Cannot update asset field: no local asset.");
    state.localAsset[field] = value;
  }

  // this is a hook to allow components to register a callback
  // before the asset is saved. Use case: triggering an automatic
  // save of a related asset
  const beforeSaveCallbacks: (() => Promise<void>)[] = [];
  function onBeforeSave(fn: () => Promise<void>): void {
    beforeSaveCallbacks.push(fn);
  }

  async function runBeforeSaveCallbacks() {
    await Promise.allSettled(beforeSaveCallbacks.map((callback) => callback()));
  }

  function updateModifiedInlineRelatedAsset(
    widgetContentItemId: T.WithId<T.RelatedAssetWidgetContent>["id"],
    hasChangedSinceSave: boolean
  ): void {
    invariant(
      state.localAsset,
      "Cannot set modified inline related asset: no local asset."
    );

    hasChangedSinceSave
      ? state.modifiedInlineRelatedAssetWidgets.add(widgetContentItemId)
      : state.modifiedInlineRelatedAssetWidgets.delete(widgetContentItemId);
  }

  function isWidgetContentValid(widgetInstanceId: T.WidgetInstanceId): boolean {
    if (!state.template || !state.localAsset) return false;

    const widgetDef = state.template.widgetArray.find(
      (w) => getWidgetInstanceId(w.widgetId) === widgetInstanceId
    );
    if (!widgetDef) return false;

    const widgetContents = (state.localAsset[widgetDef.fieldTitle] ??
      []) as T.WithId<T.WidgetContent>[];
    const widgetValidation = validation.validateWidget(
      widgetDef,
      widgetContents
    );
    return widgetValidation.isValid;
  }

  function getWidgetErrors(widgetInstanceId: T.WidgetInstanceId): string[] {
    if (!state.template || !state.localAsset) return [];

    const widgetDef = state.template.widgetArray.find(
      (w) => getWidgetInstanceId(w.widgetId) === widgetInstanceId
    );
    if (!widgetDef) return [];

    const widgetContents = (state.localAsset[widgetDef.fieldTitle] ??
      []) as T.WithId<T.WidgetContent>[];
    const widgetValidation = validation.validateWidget(
      widgetDef,
      widgetContents
    );
    return widgetValidation.errors;
  }

  function getFieldErrors(contentId: string, fieldName: string): string[] {
    if (!state.template || !state.localAsset) return [];

    // Find validation for the widget that contains this content
    for (const widgetDef of state.template.widgetArray) {
      const widgetContents = (state.localAsset[widgetDef.fieldTitle] ??
        []) as T.WithId<T.WidgetContent>[];
      const widgetValidation = validation.validateWidget(
        widgetDef,
        widgetContents
      );
      const contentErrors = widgetValidation.fieldErrors.get(contentId);
      if (contentErrors) {
        const fieldErrors = contentErrors.get(fieldName);
        if (fieldErrors) {
          return fieldErrors;
        }
      }
    }
    return [];
  }

  function hasFieldError(contentId: string, fieldName: string): boolean {
    return getFieldErrors(contentId, fieldName).length > 0;
  }

  // wrapping in reactive to auto-unwrap refs
  return reactive({
    // state
    ...toRefs(state),

    // computed
    assetId,
    templateId: computed(() => state.template?.templateId ?? null),
    collectionId: computed(() => state.localAsset?.collectionId ?? null),
    isNewAsset: computed(() => !state.localAsset?.assetId),
    collectionOptions,
    templateOptions,
    localAssetTitle,
    savedAssetTitle,
    hasAssetChanged,
    isFormValid,
    widgetIdsWithContent,
    isBlank,
    missingRequiredFields,
    invalidFields,
    tocItems,

    // actions
    reset,
    initNewAsset,
    initExistingAsset,
    saveAsset,
    migrateToTemplate,
    refreshAsset,
    updateLocalAsset,
    updateCollection,
    updateAssetField,
    onBeforeSave,
    updateModifiedInlineRelatedAsset,
    getWidgetInstanceId,
    isWidgetContentValid,
    getWidgetErrors,
    getFieldErrors,
    hasFieldError,
  });
};

export type AssetEditor = ReturnType<typeof useAssetEditor>;
