import * as T from "@/types";
import {
  computed,
  inject,
  nextTick,
  onScopeDispose,
  reactive,
  ref,
} from "vue";
import {
  editorReducer,
  initialEditorModel,
  selectHasUnsavedEdits,
  isEditingAsset,
  selectLoadError,
  selectEditedAsset,
  selectLocalAsset,
  selectTemplateId,
  type EditorCommand,
  type EditorEvent,
  type EditorModel,
} from "./editorReducer";
import { toSaveableFormData } from "./toSaveableFormData";
import invariant from "tiny-invariant";
import * as fetchers from "@/api/fetchers";
import { ASSET_EDITOR_PROVIDE_KEY } from "@/constants/constants";
import { useUpdateAssetMutation } from "@/queries/useUpdateAssetMutation";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import { assetQuery } from "@/queries/useAssetQuery";
import { templateQuery } from "@/queries/useTemplateQuery";
import { createSaveQueue } from "./createSaveQueue";

/** An inline related asset's editor, as its parent needs to see it. */
export interface ChildEditor {
  hasUnsavedChanges: () => boolean;
  save: () => Promise<void>;
}

/**
 * How the owning page runs the commands the reducer emits. Navigation,
 * broadcasts, and toasts belong to the page, not the editor, so the page
 * supplies them here. Handlers stop firing once the creating component's
 * scope is disposed: a command must not navigate a page the user has left.
 */
export interface EditorCommandHandlers {
  onAssetCreated: (assetId: T.Asset["assetId"]) => void;
}

/**
 * Creates (but does NOT provide) a reactive asset editor: the model, its
 * transitions, and the registry of inline child editors. Each call owns its
 * state, so an inline related asset's editor never touches the page's.
 * Descendant components reach the editor provided above them with
 * `useAssetEditor`.
 */
export const createAssetEditor = (commandHandlers: EditorCommandHandlers) => {
  // `ref` (not shallowRef) keeps nested widget contents reactive for
  // components that hold on to content items
  const model = ref<EditorModel>(initialEditorModel);

  // state the shell owns, which the reducer has no opinion about
  interface ShellState {
    editorId: string;

    // inline related assets have their own editors, so their unsaved changes
    // and their saves both live outside this editor's model. Each child adds
    // itself on mount and removes itself on unmount.
    childEditors: Set<ChildEditor>;
  }
  const shellState = reactive<ShellState>({
    editorId: crypto.randomUUID(),
    childEditors: new Set(),
  });

  // A save can still be in flight when the user navigates away. Vue
  // disposes this scope when the editor's component unmounts, so work
  // that resolves afterward can check whether its page is still there.
  let isScopeDisposed = false;
  onScopeDispose(() => {
    isScopeDisposed = true;
  });

  function dispatch(event: EditorEvent): void {
    const { model: nextModel, commands } = editorReducer(model.value, event);
    model.value = nextModel;
    commands?.forEach(runCommand);
  }

  function runCommand(command: EditorCommand): void {
    // a save's commands must not act on whatever page came next
    if (isScopeDisposed) return;
    switch (command.type) {
      case "notifyAssetCreated":
        commandHandlers.onAssetCreated(command.assetId);
        return;
    }
  }

  function toError(cause: unknown): Error {
    return cause instanceof Error ? cause : new Error(String(cause));
  }

  const queryClient = useQueryClient();
  const updateAssetMutation = useUpdateAssetMutation();

  const localAsset = computed((): T.Asset | T.UnsavedAsset | null =>
    selectLocalAsset(model.value)
  );

  const savedAsset = computed((): T.Asset | null =>
    model.value.status === "editingExistingAsset"
      ? model.value.savedAsset
      : null
  );

  const templateId = computed((): number | null =>
    selectTemplateId(model.value)
  );

  // the template document lives in the query cache, keyed by the id the
  // model names. The editor swaps templates only through explicit loads and
  // migrations, so the subscription renders the cached document and never
  // refreshes it underneath the user: hence staleTime Infinity.
  const editorTemplateQuery = useQuery({
    ...templateQuery(() => templateId.value),
    enabled: () => templateId.value !== null,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  const template = computed(
    (): T.Template | null => editorTemplateQuery.data.value ?? null
  );

  const getWidgetInstanceId = (
    widgetId: T.WidgetDef["widgetId"]
  ): T.WidgetInstanceId => `${shellState.editorId}-${widgetId}`;

  const hasUnsavedChanges = computed(() => {
    const childEditors = [...shellState.childEditors];
    const hasChildWithUnsavedChanges = childEditors.some((childEditor) =>
      childEditor.hasUnsavedChanges()
    );
    return (
      selectHasUnsavedEdits(model.value, template.value) ||
      hasChildWithUnsavedChanges
    );
  });

  /**
   * Reset the state to initial values
   */
  function reset(): void {
    dispatch({ type: "resetRequested" });
    shellState.editorId = crypto.randomUUID();
    shellState.childEditors.clear();
  }

  /**
   * A template id the server has no record of comes back as a null result
   * rather than a throw, so every caller would otherwise repeat this check.
   */
  async function fetchTemplateOrFail(templateId: number): Promise<T.Template> {
    const template = await queryClient.fetchQuery(templateQuery(templateId));
    if (!template) {
      throw new Error(`No template found with id ${templateId}`);
    }
    return template;
  }

  /**
   * Initialize a new asset based on a template and collection
   */
  async function initNewAsset({
    templateId: requestedTemplateId,
    collectionId,
  }: {
    templateId: number;
    collectionId: number;
  }): Promise<void> {
    dispatch({
      type: "newAssetRequested",
      collectionId,
      templateId: requestedTemplateId,
    });

    try {
      const template = await fetchTemplateOrFail(requestedTemplateId);
      dispatch({
        type: "templateDocumentLoaded",
        templateId: requestedTemplateId,
        template,
      });
    } catch (cause) {
      const error = toError(cause);
      dispatch({
        type: "templateDocumentLoadFailed",
        templateId: requestedTemplateId,
        error,
      });
      throw error;
    }
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
      fetchedAsset = await queryClient.fetchQuery({
        ...assetQuery(assetId),
        // a save writes back every field the editor holds, so a document read
        // from the cache would overwrite whatever changed since it was cached.
        // staleTime 0 refetches while still filling the shared cache.
        staleTime: 0,
      });
      invariant(fetchedAsset, `no asset found with id ${assetId}`);

      const templateId = fetchedAsset.templateId ?? null;
      invariant(templateId, "no templateId on saved asset");
      invariant(fetchedAsset.collectionId, "no collectionId on saved asset");

      const isTemplateAlreadyLoaded = template.value?.templateId === templateId;
      nextTemplate = isTemplateAlreadyLoaded
        ? template.value
        : await fetchTemplateOrFail(templateId);
    } catch (cause) {
      const error = toError(cause);
      dispatch({ type: "assetLoadFailed", editorGeneration, error });
      throw error;
    }

    dispatch({
      type: "assetLoaded",
      editorGeneration,
      savedAsset: fetchedAsset,
      template: nextTemplate,
    });
  }

  // Serialize saves so the assetId from the first CREATE is written back
  // before the next save reads it, preventing duplicate assets.
  const { save: saveAsset, waitForCurrentSaveToSettle } = createSaveQueue(
    saveAssetAndChildren,
    2000
  );

  async function saveAssetAndChildren(): Promise<void> {
    invariant(isEditingAsset(model.value), "Cannot save: no local asset");
    await saveChildrenWithUnsavedChanges();

    // saving a child may have dispatched edits here, so re-read the model
    const modelToSave = model.value;
    invariant(
      isEditingAsset(modelToSave),
      "Cannot save: editor was reset while its children saved"
    );

    // captured before the request so a save that lands after the editor
    // took in a different asset is dropped rather than stamped onto it
    const editorGeneration = modelToSave.editorGeneration;
    const assetToSave = selectEditedAsset(modelToSave);
    const templateDocument = template.value;
    invariant(
      templateDocument,
      "Cannot save: the template document is not loaded"
    );
    invariant(
      assetToSave.templateId === templateDocument.templateId,
      "Cannot save: localAsset.templateId !== template.templateId"
    );

    // the assetId comes from the model rather than the route, so an
    // auto-save fired before the URL updates still sends an update
    const formData = toSaveableFormData(assetToSave, templateDocument);
    const isCreate = !assetToSave.assetId;

    const { objectId } = await updateAssetMutation.mutateAsync(formData);
    invariant(objectId, "Expected an objectId back from the save");

    if (isCreate) {
      // commit the id before the read-back: if that read fails, the editor
      // must still know the asset exists, or the next save creates another
      dispatch({
        type: "assetCreated",
        editorGeneration,
        savedAsset: {
          ...assetToSave,
          assetId: objectId,
          modified: {
            date: new Date().toISOString(),
            timezone_type: 3,
            timezone: "UTC",
          },
        },
        template: templateDocument,
      });
    }

    const fetchedAsset = await fetchers.fetchAsset(objectId);
    invariant(fetchedAsset, `no asset found with id ${objectId} after saving`);

    dispatch({
      type: "saveSucceeded",
      editorGeneration,
      savedAsset: fetchedAsset,
      template: templateDocument,
    });
  }

  function updateCollection(collectionId: number): void {
    dispatch({ type: "collectionChanged", collectionId });
  }

  /**
   * update the template in the state, and migrates the current local asset
   * to the new template.
   */
  async function migrateToTemplate(newTemplateId: number): Promise<void> {
    // migration advances the generation, which would strand a create still in
    // flight: its response would be dropped, the editor would never learn the
    // new assetId, and the next save would create a second asset
    await waitForCurrentSaveToSettle();

    const currentModel = model.value;
    invariant(
      isEditingAsset(currentModel),
      "Cannot change template: no local asset."
    );

    const isAlreadyOnTemplate =
      selectEditedAsset(currentModel).templateId === newTemplateId;
    if (isAlreadyOnTemplate) {
      return;
    }

    dispatch({ type: "templateMigrationRequested" });
    const editorGeneration = model.value.editorGeneration;

    try {
      const template = await fetchTemplateOrFail(newTemplateId);
      dispatch({ type: "templateMigrated", editorGeneration, template });
    } catch (cause) {
      const error = toError(cause);
      dispatch({ type: "templateMigrationFailed", editorGeneration, error });
      throw error;
    }
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

  /**
   * Let an inline related asset's editor be seen and saved by this one.
   *
   * @returns the function that undoes the registration. Children must call it
   * when they unmount, or this editor keeps saving one nobody can see.
   */
  function registerChildEditor(childEditor: ChildEditor): () => void {
    shellState.childEditors.add(childEditor);
    return () => {
      shellState.childEditors.delete(childEditor);
    };
  }

  async function saveChildrenWithUnsavedChanges(): Promise<void> {
    const childEditors = [...shellState.childEditors];
    const childrenToSave = childEditors.filter((childEditor) =>
      childEditor.hasUnsavedChanges()
    );

    // settled, not all: a child that cannot be saved is independent of this
    // asset and must not cost the user their edits to it. Children report
    // their own failures.
    await Promise.allSettled(
      childrenToSave.map((childEditor) => childEditor.save())
    );
    // children dispatch into this editor as they save, so let those land
    // before the caller reads the model
    await nextTick();
  }

  // wrapping in reactive to auto-unwrap refs
  return reactive({
    localAsset,
    savedAsset,
    template,
    status: computed(() => model.value.status),
    isEditingAsset: computed((): boolean => isEditingAsset(model.value)),
    templateId,
    collectionId: computed(() => localAsset.value?.collectionId ?? null),
    hasUnsavedChanges,
    loadError: computed(() => selectLoadError(model.value)),
    saveAssetIndicator: updateAssetMutation.status,
    reset,
    initNewAsset,
    initExistingAsset,
    saveAsset,
    migrateToTemplate,
    updateCollection,
    updateWidgetContents,
    updateReadyForDisplay,
    updateAvailableAfter,
    registerChildEditor,
    getWidgetInstanceId,
  });
};

export type AssetEditor = ReturnType<typeof createAssetEditor>;

/**
 * Injects the nearest provided asset editor: the page's editor on a full
 * page, the inline child's editor under an inline related asset.
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
