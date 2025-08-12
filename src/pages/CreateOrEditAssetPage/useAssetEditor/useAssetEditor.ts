import * as T from "@/types";
import { MutationStatus } from "@tanstack/vue-query";
import { computed, reactive, toRefs } from "vue";
import { useInstanceStore } from "@/stores/instanceStore";
import {
  hasAssetChanged as hasAssetChangedPure,
  doAllRequiredHaveContent,
  makeLocalAsset,
  toSaveableFormData,
} from "./utils";
import invariant from "tiny-invariant";
import * as fetchers from "@/api/fetchers";
import { hasWidgetContent } from "@/helpers/hasWidgetContent";

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

export const useAssetEditor = () => {
  const state = reactive<AssetEditorState>(initState());

  const assetId = computed(
    (): T.Asset["assetId"] | null => state.localAsset?.assetId ?? null
  );

  const instanceStore = useInstanceStore();

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
    if (!state.template || !state.localAsset) return false;
    return doAllRequiredHaveContent(state.localAsset, state.template);
  });

  const widgetIdsWithContent = computed((): T.WidgetDef["widgetId"][] => {
    return (
      state.template?.widgetArray
        .filter((widgetDef) => {
          const widgetKey = widgetDef.fieldTitle;
          const contents = (state.localAsset?.[widgetKey] ??
            []) as T.WidgetContent[];
          return hasWidgetContent(contents, widgetDef.type);
        })
        .map((widgetDef) => widgetDef.widgetId) ?? []
    );
  });

  // ACTIONS
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
  async function saveAsset({
    refresh,
  }: { refresh?: boolean } = {}): Promise<void> {
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

      // update the local assetId with the returned objectId
      state.localAsset.assetId = objectId;
      state.saveAssetStatus = "success";

      setTimeout(() => {
        state.saveAssetStatus = "idle"; // Reset status after a delay
      }, 3000);

      if (refresh) {
        return refreshAsset();
      }
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
    getWidgetInstanceId: (
      widgetId: T.WidgetDef["widgetId"]
    ): T.WidgetInstanceId => `${state.editorId}-${widgetId}`,
  });
};

export type AssetEditor = ReturnType<typeof useAssetEditor>;
