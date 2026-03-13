import * as T from "@/types";
import { computed, inject, nextTick, reactive, toRefs } from "vue";
import { useInstanceStore } from "@/stores/instanceStore";
import {
  hasAssetChanged as hasAssetChangedPure,
  makeLocalAsset,
} from "./utils";
import { toSaveableFormData } from "./toSaveableFormData";
import invariant from "tiny-invariant";
import * as fetchers from "@/api/fetchers";
import { ASSET_EDITOR_PROVIDE_KEY } from "@/constants/constants";
import { useUpdateAssetMutation } from "@/queries/useUpdateAssetMutation";
import { createSaveQueue } from "./createSaveQueue";

interface AssetEditorState {
  editorId: string; // unique ID for this editor instance
  localAsset: T.Asset | T.UnsavedAsset | null;
  savedAsset: T.Asset | null;
  template: T.Template | null;
  isInitialized: boolean;
  modifiedInlineRelatedAssetWidgets: Set<T.Asset["assetId"]>;
  isTemplateLoading?: boolean;
}

const initState = (opts?: Partial<AssetEditorState>): AssetEditorState => ({
  editorId: crypto.randomUUID(),
  localAsset: null,
  savedAsset: null,
  template: null,
  isInitialized: false,
  isTemplateLoading: false,

  // inline related assets are part of this local asset
  // so we track widgets that have changed here
  modifiedInlineRelatedAssetWidgets: new Set(),
  ...opts,
});

/**
 * Creates (but does NOT provide) a reactive asset editor state
 *  and methods to manage the asset lifecycle
 * Note that each instance of this composable has
 * its own state, so that it can be used in inline related
 * assets without affecting the main asset editor.
 * use `useAssetEditor` in child components to access the parent instance
 */
export const createAssetEditor = () => {
  const state = reactive<AssetEditorState>(initState());

  const assetId = computed(
    (): T.Asset["assetId"] | null => state.localAsset?.assetId ?? null
  );

  const instanceStore = useInstanceStore();
  const updateAssetMutation = useUpdateAssetMutation();

  ////////////////////////////////////////////////
  // COMPUTED

  const collectionOptions = computed((): T.SelectOption<number>[] => {
    // show all collections, but disable ones that cannot be edited
    const collections = instanceStore.flatCollections ?? [];
    return collections
      .map((collection) => ({
        label: collection.title,
        id: collection.id,
        disabled: !collection.canEdit,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
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

  // Coalescing save queue: at most one save in flight, with a 2s cooldown
  // between saves. Ensures the assetId from the first CREATE is written back
  // before any subsequent save reads it, preventing duplicate assets.
  const { save: enqueueSave } = createSaveQueue(doSave, 2000);

  /**
   * Save the current local asset to the backend.
   *
   * Coalescing: concurrent callers all share the same in-flight save and
   * receive individual promises that resolve together. The queue enforces a
   * 2s cooldown between saves, collapsing any number of queued requests into
   * at most one pending save.
   */
  function saveAsset(): Promise<void> {
    return enqueueSave();
  }

  async function doSave(): Promise<void> {
    invariant(state.localAsset, "Cannot save: no local asset");
    invariant(state.template, "Cannot save: no template");
    invariant(
      state.localAsset.templateId === state.template.templateId,
      "Cannot save: localAsset.templateId !== template.templateId"
    );

    await runBeforeSaveCallbacks();

    // toSaveableFormData uses state.localAsset.assetId (not the route prop) to
    // decide create vs. update: empty string = create, non-empty = update.
    // localAsset.assetId is the editor's source of truth — after the first save
    // populates it, all subsequent saves (including auto-saves from upload
    // widgets before the URL has been updated) correctly send an update.
    const formData = toSaveableFormData(state.localAsset, state.template);
    const isCreate = !state.localAsset.assetId;

    console.debug("[useAssetEditor] doSave: saving asset", {
      operation: isCreate ? "CREATE" : "UPDATE",
      assetId: state.localAsset.assetId || "(new)",
      templateId: state.template.templateId,
      collectionId: state.localAsset.collectionId,
    });

    const { objectId } = await updateAssetMutation.mutateAsync(formData);
    console.debug("[useAssetEditor] doSave: save succeeded", {
      objectId,
      operation: isCreate ? "CREATE" : "UPDATE",
    });
    invariant(objectId, "Expected objectId to be defined after saveAsset");

    const savedAsset = await fetchers.fetchAsset(objectId);
    invariant(savedAsset, "Expected saved asset to be defined after saveAsset");

    state.savedAsset = savedAsset;

    // make some targeted updates to the local asset to avoid unnecessary reactivity
    state.localAsset.assetId = savedAsset.assetId;
    state.localAsset.title = savedAsset.title;
    state.localAsset.modified = savedAsset.modified;
    state.localAsset.modifiedBy = savedAsset.modifiedBy;
    state.localAsset.firstFileHandlerId = savedAsset.firstFileHandlerId;

    // clear any upload widget `regenerate` flags
    const uploadWidgetItems = state.template.widgetArray
      .filter((w) => w.type === T.WIDGET_TYPES.UPLOAD)
      .flatMap(
        (w) =>
          state.localAsset?.[w.fieldTitle] as T.WithId<T.UploadWidgetContent>[]
      )
      .filter(Boolean);

    uploadWidgetItems.forEach((item) => {
      item.regenerate = undefined;
    });
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

    state.localAsset = {
      ...updatedAsset,
      // if updatedAsset contains a stale empty (new) assetId,
      // but current localAsset has a non-empty assetId, preserve the
      // non-empty one to prevent accidentally creating a new asset on save.
      assetId: updatedAsset.assetId || state.localAsset.assetId,
    };
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
    // wait for next tick to ensure any state changes are applied
    await nextTick();
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
    saveAssetIndicator: updateAssetMutation.status,
    lastModified: computed(() => {
      if (!state.localAsset?.modified?.date) return null;
      return new Date(state.localAsset.modified.date).toLocaleString();
    }),

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
  });
};

export type AssetEditor = ReturnType<typeof createAssetEditor>;

/**
 * Injects the parent asset editor from provide/inject context
 * Use this when you need to access the parent editor instance
 */
export const useAssetEditor = (): AssetEditor => {
  const assetEditor = inject(ASSET_EDITOR_PROVIDE_KEY);
  if (!assetEditor) {
    throw new Error(
      "useAssetEditor must be called within an AssetEditor provider"
    );
  }
  return assetEditor;
};
