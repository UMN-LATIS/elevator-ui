import * as T from "@/types";
import { computed, inject, nextTick, reactive, ref } from "vue";
import { useInstanceStore } from "@/stores/instanceStore";
import {
  editorReducer,
  initialEditorModel,
  selectHasUnsavedEdits,
  selectLoadError,
  selectLocalAsset,
  type EditorEvent,
  type EditorModel,
} from "./editorReducer";
import { toSaveableFormData } from "./toSaveableFormData";
import invariant from "tiny-invariant";
import * as fetchers from "@/api/fetchers";
import { ASSET_EDITOR_PROVIDE_KEY } from "@/constants/constants";
import { useUpdateAssetMutation } from "@/queries/useUpdateAssetMutation";
import { useQueryClient } from "@tanstack/vue-query";
import { ASSETS_QUERY_KEY, TEMPLATES_QUERY_KEY } from "@/queries/queryKeys";
import { createSaveQueue } from "./createSaveQueue";

/**
 * Creates (but does NOT provide) a reactive asset editor state
 *  and methods to manage the asset lifecycle
 * Note that each instance of this composable has
 * its own state, so that it can be used in inline related
 * assets without affecting the main asset editor.
 * use `useAssetEditor` in child components to access the parent instance
 */
export const createAssetEditor = () => {
  // `ref` (not shallowRef) keeps nested widget contents reactive for
  // components that hold on to content items
  const model = ref<EditorModel>(initialEditorModel);

  // state the shell owns, which the reducer has no opinion about
  interface ShellState {
    editorId: string;

    // the activity axis: whether a template request is in flight, which is
    // separate from whether the model has a template (its status)
    isTemplateLoading: boolean;

    // inline related assets have their own editors, so their unsaved
    // changes never show up in this editor's edits
    modifiedInlineRelatedAssetWidgets: Set<T.Asset["assetId"]>;
  }
  const shellState = reactive<ShellState>({
    editorId: crypto.randomUUID(),
    isTemplateLoading: false,
    modifiedInlineRelatedAssetWidgets: new Set(),
  });

  function dispatch(event: EditorEvent): void {
    model.value = editorReducer(model.value, event);
  }

  function toError(cause: unknown): Error {
    return cause instanceof Error ? cause : new Error(String(cause));
  }

  function fetchTemplateThroughCache(
    templateId: number
  ): Promise<T.Template | null> {
    return queryClient.fetchQuery({
      queryKey: [TEMPLATES_QUERY_KEY, templateId],
      queryFn: () => fetchers.fetchTemplate(templateId),
    });
  }

  function fetchAssetThroughCache(
    assetId: T.Asset["assetId"]
  ): Promise<T.Asset | null> {
    return queryClient.fetchQuery({
      queryKey: [ASSETS_QUERY_KEY, assetId],
      queryFn: () => fetchers.fetchAsset(assetId),
    });
  }

  const queryClient = useQueryClient();
  const instanceStore = useInstanceStore();
  const updateAssetMutation = useUpdateAssetMutation();

  const localAsset = computed((): T.Asset | T.UnsavedAsset | null =>
    selectLocalAsset(model.value)
  );

  const savedAsset = computed((): T.Asset | null =>
    model.value.status === "editingExistingAsset" ? model.value.savedAsset : null
  );

  const template = computed((): T.Template | null =>
    "template" in model.value ? model.value.template : null
  );

  const isInitialized = computed(
    (): boolean =>
      model.value.status === "editingNewAsset" ||
      model.value.status === "editingExistingAsset"
  );

  const assetId = computed(
    (): T.Asset["assetId"] | null => localAsset.value?.assetId ?? null
  );

  const getWidgetInstanceId = (
    widgetId: T.WidgetDef["widgetId"]
  ): T.WidgetInstanceId => `${shellState.editorId}-${widgetId}`;

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
    () => savedAsset.value?.title?.[0] ?? savedAsset.value?.assetId ?? ""
  );

  const localAssetTitle = computed(() => {
    if (!localAsset.value) return "";
    const localTitle = localAsset.value.title?.[0];

    // if there's no title set, try the title widget
    const titleWidgetContents = localAsset.value.title_1 as
      | T.TextWidgetContent[]
      | undefined;
    const widgetTitle = titleWidgetContents?.[0]?.fieldContents;

    return localTitle || widgetTitle || "";
  });

  const hasAssetChanged = computed(() => {
    // do have any modified inline related assets?
    const haveInlineRelatedAssetsChanged =
      shellState.modifiedInlineRelatedAssetWidgets.size > 0;
    return selectHasUnsavedEdits(model.value) || haveInlineRelatedAssetsChanged;
  });

  /**
   * Reset the state to initial values
   */
  function reset(): void {
    dispatch({ type: "resetRequested" });
    shellState.editorId = crypto.randomUUID();
    shellState.isTemplateLoading = false;
    shellState.modifiedInlineRelatedAssetWidgets = new Set();
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
    dispatch({ type: "newAssetRequested", collectionId });
    const editorGeneration = model.value.editorGeneration;

    shellState.isTemplateLoading = true;
    let template: T.Template | null;
    try {
      template = await fetchTemplateThroughCache(templateId);
    } catch (cause) {
      dispatch({ type: "templateLoadFailed", editorGeneration, error: toError(cause) });
      throw cause;
    } finally {
      shellState.isTemplateLoading = false;
    }

    if (!template) {
      const error = new Error(
        `Cannot initialize new asset: no template found with id ${templateId}`
      );
      dispatch({ type: "templateLoadFailed", editorGeneration, error });
      throw error;
    }

    dispatch({ type: "templateLoaded", editorGeneration, template });
  }

  /**
   * Initialize the editor with an existing asset by its ID
   */
  async function initExistingAsset(
    assetId: T.Asset["assetId"],
    opts: { force?: boolean } = {}
  ): Promise<void> {
    if (localAsset.value?.assetId === assetId && !opts.force) {
      return;
    }

    dispatch({ type: "existingAssetRequested" });
    const editorGeneration = model.value.editorGeneration;

    let fetchedAsset: T.Asset | null;
    let nextTemplate: T.Template | null;
    try {
      fetchedAsset = await fetchAssetThroughCache(assetId);
      invariant(fetchedAsset, `no asset found with id ${assetId}`);

      const templateId = fetchedAsset.templateId ?? null;
      invariant(templateId, "no templateId on saved asset");
      invariant(fetchedAsset.collectionId, "no collectionId on saved asset");

      const isTemplateAlreadyLoaded = template.value?.templateId === templateId;
      nextTemplate = isTemplateAlreadyLoaded
        ? template.value
        : await fetchTemplateThroughCache(templateId);
      invariant(
        nextTemplate,
        `cannot setAssetId: no template with id ${templateId}`
      );
    } catch (cause) {
      dispatch({ type: "assetLoadFailed", editorGeneration, error: toError(cause) });
      throw cause;
    }

    dispatch({
      type: "assetLoaded",
      editorGeneration,
      savedAsset: fetchedAsset,
      template: nextTemplate,
    });
  }

  /**
   * Reload the current asset from the backend (if it has an assetId)
   */
  async function refreshAsset(): Promise<void> {
    invariant(localAsset.value?.assetId, "Cannot refresh: no assetId");
    return initExistingAsset(localAsset.value.assetId, { force: true });
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
    const modelBeforeCallbacks = model.value;
    invariant(
      modelBeforeCallbacks.status === "editingNewAsset" ||
        modelBeforeCallbacks.status === "editingExistingAsset",
      "Cannot save: no local asset"
    );
    await runBeforeSaveCallbacks();

    // callbacks may have dispatched edits, so re-read the model
    const modelToSave = model.value;
    invariant(
      modelToSave.status === "editingNewAsset" ||
        modelToSave.status === "editingExistingAsset",
      "Cannot save: editor was reset during before-save callbacks"
    );

    // captured before the request so a save that lands after the editor
    // took in a different asset is dropped rather than stamped onto it
    const editorGeneration = modelToSave.editorGeneration;
    const assetToSave = selectLocalAsset(modelToSave);
    invariant(assetToSave, "Cannot save: no local asset");
    invariant(
      assetToSave.templateId === modelToSave.template.templateId,
      "Cannot save: localAsset.templateId !== template.templateId"
    );

    // the assetId comes from the model rather than the route, so an
    // auto-save fired before the URL updates still sends an update
    const formData = toSaveableFormData(assetToSave, modelToSave.template);
    const isCreate = !assetToSave.assetId;

    console.debug("[useAssetEditor] doSave: saving asset", {
      operation: isCreate ? "CREATE" : "UPDATE",
      assetId: assetToSave.assetId || "(new)",
      templateId: modelToSave.template.templateId,
      collectionId: assetToSave.collectionId,
    });

    const { objectId } = await updateAssetMutation.mutateAsync(formData);
    console.debug("[useAssetEditor] doSave: save succeeded", {
      objectId,
      operation: isCreate ? "CREATE" : "UPDATE",
    });
    invariant(objectId, "Expected objectId to be defined after saveAsset");

    const fetchedAsset = await fetchers.fetchAsset(objectId);
    invariant(
      fetchedAsset,
      "Expected saved asset to be defined after saveAsset"
    );

    dispatch({
      type: "saveSucceeded",
      editorGeneration,
      didCreateAsset: isCreate,
      savedAsset: fetchedAsset,
    });
  }

  async function updateCollection(newCollectionId: number): Promise<void> {
    invariant(localAsset.value, "Cannot change collection: no local asset.");
    invariant(template.value, "Cannot change collection: no current template.");
    dispatch({ type: "collectionChanged", collectionId: newCollectionId });

    // component should handle the saving and redirecting
  }

  /**
   * update the template in the state, and migrates the current local asset
   * to the new template.
   */
  async function migrateToTemplate(newTemplateId: number): Promise<void> {
    const currentModel = model.value;
    invariant(
      currentModel.status === "editingNewAsset" || currentModel.status === "editingExistingAsset",
      "Cannot change template: no local asset."
    );

    if (
      // if all templateIds are the same, return the current template
      currentModel.template.templateId === newTemplateId &&
      selectLocalAsset(currentModel)?.templateId === newTemplateId
    ) {
      return;
    }

    const editorGeneration = currentModel.editorGeneration;
    shellState.isTemplateLoading = true;
    let newTemplate: T.Template | null;
    try {
      newTemplate = await fetchTemplateThroughCache(newTemplateId);
    } catch (cause) {
      dispatch({
        type: "templateLoadFailed",
        editorGeneration,
        error: toError(cause),
      });
      throw cause;
    } finally {
      shellState.isTemplateLoading = false;
    }

    if (!newTemplate) {
      const error = new Error(
        `Cannot update templateId: no template found with id ${newTemplateId}`
      );
      dispatch({ type: "templateLoadFailed", editorGeneration, error });
      throw error;
    }

    dispatch({
      type: "templateMigrated",
      editorGeneration,
      template: newTemplate,
    });

    // component should handle the saving
  }

  function updateWidgetContents(
    fieldTitle: T.WidgetDef["fieldTitle"],
    contents: T.WidgetContent[]
  ): void {
    dispatch({ type: "widgetContentsEdited", fieldTitle, contents });
  }

  function updateReadyForDisplay(readyForDisplay: boolean): void {
    dispatch({ type: "readyForDisplayChanged", readyForDisplay });
  }

  function updateAvailableAfter(availableAfter: T.PHPDateTime | null): void {
    dispatch({ type: "availableAfterChanged", availableAfter });
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
      localAsset.value,
      "Cannot set modified inline related asset: no local asset."
    );

    if (hasChangedSinceSave) {
      shellState.modifiedInlineRelatedAssetWidgets.add(widgetContentItemId);
    } else {
      shellState.modifiedInlineRelatedAssetWidgets.delete(widgetContentItemId);
    }
  }

  // wrapping in reactive to auto-unwrap refs
  return reactive({
    // state (selectors over the model)
    editorId: computed(() => shellState.editorId),
    localAsset,
    savedAsset,
    template,
    isInitialized,
    isTemplateLoading: computed(() => shellState.isTemplateLoading),
    modifiedInlineRelatedAssetWidgets: computed(
      () => shellState.modifiedInlineRelatedAssetWidgets
    ),

    // computed
    assetId,
    templateId: computed(() => template.value?.templateId ?? null),
    collectionId: computed(() => localAsset.value?.collectionId ?? null),
    isNewAsset: computed(() => !localAsset.value?.assetId),
    collectionOptions,
    templateOptions,
    localAssetTitle,
    savedAssetTitle,
    hasAssetChanged,
    loadError: computed(() => selectLoadError(model.value)),
    saveAssetIndicator: updateAssetMutation.status,
    lastModified: computed(() => {
      if (!localAsset.value?.modified?.date) return null;
      return new Date(localAsset.value.modified.date).toLocaleString();
    }),

    // effects
    reset,
    initNewAsset,
    initExistingAsset,
    saveAsset,
    migrateToTemplate,
    refreshAsset,
    updateCollection,
    updateWidgetContents,
    updateReadyForDisplay,
    updateAvailableAfter,
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
