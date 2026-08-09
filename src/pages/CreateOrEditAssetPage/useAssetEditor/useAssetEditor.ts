import * as T from "@/types";
import {
  computed,
  inject,
  nextTick,
  onScopeDispose,
  reactive,
  ref,
  watch,
} from "vue";
import {
  editorReducer,
  initialEditorModel,
  selectAssetId,
  selectHasUnsavedEdits,
  isEditingAsset,
  selectLoadError,
  selectLocalAsset,
  selectTemplateId,
  type EditorCommand,
  type EditorEvent,
  type EditorModel,
} from "./editorReducer";
import { toSaveableFormData } from "./toSaveableFormData";
import invariant from "tiny-invariant";
import { ASSET_EDITOR_PROVIDE_KEY } from "@/constants/constants";
import { useUpdateAssetMutation } from "@/queries/useUpdateAssetMutation";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import { assetQuery } from "@/queries/useAssetQuery";
import { templateQuery } from "@/queries/useTemplateQuery";
import {
  clearUploadRegenerationFlags,
  makeLocalAssetFromSaved,
} from "./localAsset";
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
 *
 * The model holds identities and edits; the documents live in the query
 * cache. The editor subscribes to the asset and template the model names,
 * and every baseline change enters the reducer through one event,
 * baselineRefreshed, whatever caused it.
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

  const editorAssetId = computed((): string | null =>
    selectAssetId(model.value)
  );

  // the asset baseline lives in the query cache, keyed by the id the model
  // names. staleTime Infinity: the baseline refreshes only on load and on
  // invalidation (a save's read-back, an inline child's save), which is
  // today's behavior. Slice 4 of the cache-ownership plan decides anything
  // more proactive.
  const baselineQuery = useQuery({
    ...assetQuery(() => editorAssetId.value),
    enabled: () => editorAssetId.value !== null,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  const rawBaseline = computed(
    (): T.Asset | null => baselineQuery.data.value ?? null
  );

  const templateId = computed((): number | null =>
    selectTemplateId(model.value, rawBaseline.value)
  );

  // the template document, same ownership story as the baseline. The editor
  // swaps templates only through explicit loads and migrations, so the
  // subscription renders the cached document and never refreshes it
  // underneath the user.
  const editorTemplateQuery = useQuery({
    ...templateQuery(() => templateId.value),
    enabled: () => templateId.value !== null,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  const template = computed(
    (): T.Template | null => editorTemplateQuery.data.value ?? null
  );

  /**
   * The baseline in editor shape: widget contents scaffolded and carrying
   * uuids. Rebuilt by the watcher below whenever the cache document or the
   * template changes, and read everywhere else.
   */
  const scaffoldedBaseline = ref<T.Asset | null>(null);

  // the shell's one ongoing job: whatever changed the baseline document (a
  // save's read-back, an inline child's invalidation, a template swap),
  // scaffold it and hand it to the reducer as baselineRefreshed
  watch(
    [rawBaseline, template, editorAssetId] as const,
    ([rawDocument, templateDocument, assetId]) => {
      if (!assetId) {
        scaffoldedBaseline.value = null;
        return;
      }
      if (!rawDocument || !templateDocument) return;
      // the subscription can briefly hold the previous key's answer while
      // the model has moved on; a mismatched document must not scaffold
      if (rawDocument.assetId !== assetId) return;
      if (
        templateDocument.templateId !==
        selectTemplateId(model.value, rawDocument)
      ) {
        return;
      }

      // the outgoing view donates uuids to contents that arrive without one
      // (position-inheritance for backends that do not store them), so the
      // items on screen keep their identities across the refresh
      const previousView = selectLocalAsset(
        model.value,
        scaffoldedBaseline.value
      );
      const nextBaseline = makeLocalAssetFromSaved({
        template: templateDocument,
        savedAsset: rawDocument,
        previousAsset: previousView,
      });
      scaffoldedBaseline.value = nextBaseline;
      dispatch({
        type: "baselineRefreshed",
        assetId,
        baseline: nextBaseline,
        template: templateDocument,
      });
    },
    { immediate: true }
  );

  const localAsset = computed((): T.Asset | T.UnsavedAsset | null =>
    selectLocalAsset(model.value, scaffoldedBaseline.value)
  );

  const savedAsset = computed((): T.Asset | null => {
    if (model.value.status !== "editingExistingAsset") return null;
    const baseline = scaffoldedBaseline.value;
    if (!baseline || baseline.assetId !== model.value.assetId) return null;
    return baseline;
  });

  const getWidgetInstanceId = (
    widgetId: T.WidgetDef["widgetId"]
  ): T.WidgetInstanceId => `${shellState.editorId}-${widgetId}`;

  const hasUnsavedChanges = computed(() => {
    const childEditors = [...shellState.childEditors];
    const hasChildWithUnsavedChanges = childEditors.some((childEditor) =>
      childEditor.hasUnsavedChanges()
    );
    return (
      selectHasUnsavedEdits(
        model.value,
        scaffoldedBaseline.value,
        template.value
      ) || hasChildWithUnsavedChanges
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
   * Initialize the editor with an existing asset by its ID.
   *
   * The model switches immediately; this function's job is to make sure the
   * documents the subscriptions render actually arrive, and to surface a
   * failure. A fetch that resolves after the editor moved on dispatches
   * nothing on success, and its failure event carries an assetId the
   * reducer no longer holds.
   */
  async function initExistingAsset(
    assetId: T.Asset["assetId"],
    opts: { force?: boolean } = {}
  ): Promise<void> {
    if (selectAssetId(model.value) === assetId && !opts.force) {
      return;
    }

    dispatch({ type: "existingAssetRequested", assetId });

    try {
      // a save writes back every field the editor holds, so a document read
      // from the cache would overwrite whatever changed since it was cached.
      // staleTime 0 refetches while still filling the shared cache.
      const fetchedAsset = await queryClient.fetchQuery({
        ...assetQuery(assetId),
        staleTime: 0,
      });
      invariant(fetchedAsset, `no asset found with id ${assetId}`);

      const fetchedTemplateId = fetchedAsset.templateId ?? null;
      invariant(fetchedTemplateId, "no templateId on saved asset");
      await fetchTemplateOrFail(fetchedTemplateId);
    } catch (cause) {
      const error = toError(cause);
      dispatch({ type: "assetLoadFailed", assetId, error });
      throw error;
    }
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

    const assetToSave = selectLocalAsset(modelToSave, scaffoldedBaseline.value);
    invariant(assetToSave, "Cannot save: the asset document is not loaded");
    const templateDocument = template.value;
    invariant(
      templateDocument,
      "Cannot save: the template document is not loaded"
    );
    invariant(
      assetToSave.templateId === templateDocument.templateId,
      "Cannot save: localAsset.templateId !== template.templateId"
    );

    const formData = toSaveableFormData(assetToSave, templateDocument);

    const { objectId } = await updateAssetMutation.mutateAsync(formData);
    invariant(objectId, "Expected an objectId back from the save");

    if (modelToSave.status === "editingNewAsset") {
      // commit the id before the read-back: if that read fails, the editor
      // must still know the asset exists, or the next save creates another.
      // The echoed draft is the closest thing to server truth until then.
      const echoedDraft: T.Asset = clearUploadRegenerationFlags(
        {
          ...assetToSave,
          assetId: objectId,
          modified: {
            date: new Date().toISOString(),
            timezone_type: 3,
            timezone: "UTC",
          },
        },
        templateDocument
      );
      const seededBaseline = makeLocalAssetFromSaved({
        template: templateDocument,
        savedAsset: echoedDraft,
      });

      // the scaffold ref is set by hand so the view has a baseline the
      // moment the model holds the new id, without waiting for the watcher
      scaffoldedBaseline.value = seededBaseline;
      dispatch({
        type: "assetCreated",
        draftKey: modelToSave.draftKey,
        baseline: seededBaseline,
        template: templateDocument,
      });
      queryClient.setQueryData(assetQuery(objectId).queryKey, seededBaseline);
      // the seed is the echo, not server truth: invalidate so the
      // subscription reads back what the server actually stored. nextTick
      // first, so the subscription for the new id is active and refetches.
      await nextTick();
      await queryClient.invalidateQueries({
        queryKey: assetQuery(objectId).queryKey,
      });
    } else {
      // the read-back arrives through the mutation's invalidation as
      // baselineRefreshed; this event only retires the regenerate requests
      // the save carried
      dispatch({
        type: "saveAccepted",
        assetId: objectId,
        template: templateDocument,
      });
    }
  }

  function updateCollection(collectionId: number): void {
    dispatch({ type: "collectionChanged", collectionId });
  }

  /**
   * update the template in the state, and migrates the current local asset
   * to the new template.
   */
  async function migrateToTemplate(newTemplateId: number): Promise<void> {
    // a create still in flight transitions the model when it commits, and a
    // migration racing that transition would compute against the draft
    await waitForCurrentSaveToSettle();

    const currentModel = model.value;
    invariant(
      isEditingAsset(currentModel),
      "Cannot change template: no local asset."
    );
    const currentView = selectLocalAsset(
      currentModel,
      scaffoldedBaseline.value
    );
    invariant(
      currentView,
      "Cannot change template: the asset document is not loaded"
    );

    if (currentView.templateId === newTemplateId) {
      return;
    }

    dispatch({ type: "templateMigrationRequested", templateId: newTemplateId });

    try {
      const template = await fetchTemplateOrFail(newTemplateId);
      dispatch({
        type: "templateMigrated",
        templateId: newTemplateId,
        template,
        baseline: scaffoldedBaseline.value,
      });
    } catch (cause) {
      const error = toError(cause);
      dispatch({
        type: "templateMigrationFailed",
        templateId: newTemplateId,
        error,
      });
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
    // "the editor has an asset to show": for an existing asset this waits
    // for the baseline document, so pages render their loading state until
    // localAsset is real
    isEditingAsset: computed((): boolean => localAsset.value !== null),
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
