import * as T from "@/types";
import { computed, inject, nextTick, reactive, ref } from "vue";
import { useInstanceStore } from "@/stores/instanceStore";
import { hasAssetChanged as hasAssetChangedPure } from "./localAsset";
import {
  editorReducer,
  initialEditorModel,
  type EditorEvent,
  type EditorIntent,
  type EditorModel,
} from "./editorReducer";
import { toSaveableFormData } from "./toSaveableFormData";
import invariant from "tiny-invariant";
import * as fetchers from "@/api/fetchers";
import { ASSET_EDITOR_PROVIDE_KEY } from "@/constants/constants";
import { useUpdateAssetMutation } from "@/queries/useUpdateAssetMutation";
import { createSaveQueue } from "./createSaveQueue";

/**
 * Creates (but does NOT provide) a reactive asset editor state
 *  and methods to manage the asset lifecycle
 * Note that each instance of this composable has
 * its own state, so that it can be used in inline related
 * assets without affecting the main asset editor.
 * use `useAssetEditor` in child components to access the parent instance
 *
 * Internally the editor is a model plus a reducer. The surface is three
 * kinds of thing: selectors (nouns) read state, effects (imperative verbs,
 * async) fetch and then report what happened, and `dispatch` takes an
 * intent describing what the user did.
 */
export const createAssetEditor = () => {
  // `ref` (not shallowRef) keeps nested widget contents reactive for
  // components that hold on to content items
  const model = ref<EditorModel>(initialEditorModel);

  // state the shell owns, which the reducer has no opinion about
  interface ShellState {
    editorId: string; // unique ID for this editor instance
    isTemplateLoading: boolean;

    // inline related assets are part of this local asset
    // so we track widgets that have changed here
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

  const instanceStore = useInstanceStore();
  const updateAssetMutation = useUpdateAssetMutation();

  ////////////////////////////////////////////////
  // SELECTORS

  const localAsset = computed((): T.Asset | T.UnsavedAsset | null =>
    "localAsset" in model.value ? model.value.localAsset : null
  );

  const savedAsset = computed((): T.Asset | null =>
    model.value.status === "editingSaved" ? model.value.savedAsset : null
  );

  const template = computed((): T.Template | null =>
    "template" in model.value ? model.value.template : null
  );

  const isEditing = computed(
    (): boolean =>
      model.value.status === "editingNew" ||
      model.value.status === "editingSaved"
  );

  const assetId = computed(
    (): T.Asset["assetId"] | null => localAsset.value?.assetId ?? null
  );

  // a parameterized selector: derives, never mutates
  const getWidgetInstanceId = (
    widgetId: T.WidgetDef["widgetId"]
  ): T.WidgetInstanceId => `${shellState.editorId}-${widgetId}`;

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
    () => savedAsset.value?.title?.[0] ?? savedAsset.value?.assetId ?? ""
  );

  const localAssetTitle = computed(() => {
    if (!localAsset.value) return "";
    const localTitle = localAsset.value.title?.[0];

    // if there's no title set, try the title widget
    const titleWidget =
      (localAsset.value.title_1 as T.TextWidgetContent[]) || [];
    const localTitleWidgetContent = titleWidget?.[0]?.fieldContents;

    return localTitle || localTitleWidgetContent || "";
  });

  const hasAssetChanged = computed(() => {
    if (!localAsset.value || !template.value) return false;

    const hasLocalAssetChanged = hasAssetChangedPure({
      localAsset: localAsset.value,
      savedAsset: savedAsset.value,
      template: template.value,
    });

    // do have any modified inline related assets?
    const haveInlineRelatedAssetsChanged =
      shellState.modifiedInlineRelatedAssetWidgets.size > 0;
    return hasLocalAssetChanged || haveInlineRelatedAssetsChanged;
  });

  ////////////////////////////////////////////////
  // EFFECTS

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
    const generation = model.value.generation;

    shellState.isTemplateLoading = true;
    let template: T.Template | null;
    try {
      template = await fetchers.fetchTemplate(templateId);
    } catch (error) {
      dispatch({ type: "templateLoadFailed", generation });
      throw error;
    } finally {
      shellState.isTemplateLoading = false;
    }

    if (!template) {
      dispatch({ type: "templateLoadFailed", generation });
      invariant(
        template,
        `Cannot initialize new asset: no template found with id ${templateId}`
      );
    }

    dispatch({ type: "templateLoaded", generation, template });
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

    dispatch({ type: "assetRequested" });
    const generation = model.value.generation;

    const fetchedAsset = await fetchers.fetchAsset(assetId);
    invariant(fetchedAsset, `no asset found with id ${assetId}`);

    const templateId = fetchedAsset.templateId ?? null;
    invariant(templateId, "no templateId on saved asset");

    // only fetch a new template if it's not the current one
    const nextTemplate =
      template.value?.templateId === templateId
        ? template.value
        : await fetchers.fetchTemplate(templateId);

    invariant(
      nextTemplate,
      `cannot setAssetId: no template with id ${templateId}`
    );

    invariant(fetchedAsset.collectionId, "no collectionId on saved asset");

    dispatch({
      type: "assetLoaded",
      generation,
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
      modelBeforeCallbacks.status === "editingNew" ||
        modelBeforeCallbacks.status === "editingSaved",
      "Cannot save: no local asset"
    );
    invariant(
      modelBeforeCallbacks.localAsset.templateId ===
        modelBeforeCallbacks.template.templateId,
      "Cannot save: localAsset.templateId !== template.templateId"
    );

    await runBeforeSaveCallbacks();

    // callbacks may have dispatched edits, so re-read the model
    const modelToSave = model.value;
    invariant(
      modelToSave.status === "editingNew" ||
        modelToSave.status === "editingSaved",
      "Cannot save: editor was reset during before-save callbacks"
    );

    // captured before the request so a save landing in an abandoned session
    // is dropped rather than stamped onto a different asset
    const generation = modelToSave.generation;

    // toSaveableFormData uses the asset's own assetId to decide create vs.
    // update: empty means create, non-empty means update. The model is the
    // source of truth, so after the first save populates it, all subsequent
    // saves correctly send an update.
    const formData = toSaveableFormData(
      modelToSave.localAsset,
      modelToSave.template
    );
    const isCreate = !modelToSave.localAsset.assetId;

    console.debug("[useAssetEditor] doSave: saving asset", {
      operation: isCreate ? "CREATE" : "UPDATE",
      assetId: modelToSave.localAsset.assetId || "(new)",
      templateId: modelToSave.template.templateId,
      collectionId: modelToSave.localAsset.collectionId,
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
      generation,
      savedAsset: fetchedAsset,
    });

    // effect left outside the reducer on purpose: clearing `regenerate` must
    // mutate the same widget content objects components already hold
    const afterSave = model.value;
    if (afterSave.status !== "editingSaved") return;
    const uploadWidgetItems = afterSave.template.widgetArray
      .filter((w) => w.type === T.WIDGET_TYPES.UPLOAD)
      .flatMap(
        (w) =>
          afterSave.localAsset[
            w.fieldTitle
          ] as T.WithId<T.UploadWidgetContent>[]
      )
      .filter(Boolean);

    uploadWidgetItems.forEach((item) => {
      item.regenerate = undefined;
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
    const current = model.value;
    invariant(
      current.status === "editingNew" || current.status === "editingSaved",
      "Cannot change template: no local asset."
    );

    if (
      // if all templateIds are the same, return the current template
      current.template.templateId === newTemplateId &&
      current.localAsset.templateId === newTemplateId
    ) {
      return;
    }

    const generation = current.generation;
    shellState.isTemplateLoading = true;
    let newTemplate: T.Template | null;
    try {
      newTemplate = await fetchers.fetchTemplate(newTemplateId);
    } finally {
      shellState.isTemplateLoading = false;
    }
    invariant(
      newTemplate,
      `Cannot update templateId: no template found with id ${newTemplateId}`
    );

    dispatch({
      type: "templateMigrated",
      generation,
      template: newTemplate,
    });

    // component should handle the saving
  }

  async function updateLocalAsset(
    updatedAsset: T.UnsavedAsset | T.Asset
  ): Promise<void> {
    const current = model.value;
    invariant(
      current.status === "editingNew" || current.status === "editingSaved",
      "Cannot update asset: no local asset."
    );

    // If the templateId has changed, we need to update the template
    // and migrate the asset
    if (current.localAsset.templateId !== updatedAsset.templateId) {
      await migrateToTemplate(updatedAsset.templateId);
    }

    dispatch({ type: "localAssetEdited", edit: updatedAsset });
  }

  function updateWidgetContents(
    fieldTitle: T.WidgetDef["fieldTitle"],
    contents: T.WidgetContent[]
  ): void {
    invariant(
      localAsset.value,
      "Cannot update widget contents: no local asset."
    );
    dispatch({ type: "widgetContentsEdited", fieldTitle, contents });
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

    hasChangedSinceSave
      ? shellState.modifiedInlineRelatedAssetWidgets.add(widgetContentItemId)
      : shellState.modifiedInlineRelatedAssetWidgets.delete(
          widgetContentItemId
        );
  }

  // wrapping in reactive to auto-unwrap refs
  return reactive({
    // state (selectors over the model)
    editorId: computed(() => shellState.editorId),
    localAsset,
    savedAsset,
    template,
    isInitialized: isEditing,
    isTemplateLoading: computed(() => shellState.isTemplateLoading),
    modifiedInlineRelatedAssetWidgets: computed(
      () => shellState.modifiedInlineRelatedAssetWidgets
    ),

    // consumers may report what the user did. An operation's own progress
    // is the shell's to report, so those events are not in EditorIntent and
    // cannot be dispatched from outside.
    dispatch: (intent: EditorIntent) => dispatch(intent),

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
    updateLocalAsset,
    updateCollection,
    updateWidgetContents,
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
