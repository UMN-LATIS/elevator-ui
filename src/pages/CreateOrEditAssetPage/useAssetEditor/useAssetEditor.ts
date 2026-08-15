import * as T from "@/types";
import {
  computed,
  inject,
  onScopeDispose,
  reactive,
  ref,
  watch,
  type Ref,
} from "vue";
import {
  editorReducer,
  initialEditorModel,
  isSessionWithAsset,
  selectAssetId,
  selectHasUnsavedEdits,
  selectLoadError,
  selectLocalAsset,
  selectSession,
  selectSessionAndDescendantKeys,
  selectTemplateId,
  type EditorCommand,
  type EditorEvent,
  type EditorModel,
  type ParentLink,
  type SessionKey,
} from "./editorReducer";
import { toSaveableFormData } from "./toSaveableFormData";
import invariant from "tiny-invariant";
import {
  ASSET_EDITOR_PROVIDE_KEY,
  EDITOR_HOST_PROVIDE_KEY,
} from "@/constants/constants";
import { useUpdateAssetMutation } from "@/queries/useUpdateAssetMutation";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import { assetQuery } from "@/queries/useAssetQuery";
import { templateQuery } from "@/queries/useTemplateQuery";
import {
  clearUploadRegenerationFlags,
  toLocalAssetFromSavedAsset,
} from "./localAsset";
import { createSaveQueue } from "./createSaveQueue";

/**
 * How the owning page reacts to what the editor decides. Navigation,
 * broadcasts, and toasts belong to the page, not the editor, so the page
 * supplies them here. Handlers stop firing once the creating component's
 * scope is disposed: a command must not navigate a page the user has left.
 */
export interface EditorHostHandlers {
  /** the root session's draft got its id. Pages redirect or link on it. */
  onAssetCreated: (assetId: T.Asset["assetId"]) => void;
  /** an inline child's save failed while a parent save collected it */
  onChildSaveFailed: (error: unknown) => void;
  /**
   * a create landed after its session closed: the asset exists server-side
   * with nothing pointing at it
   */
  onCreateDropped: (assetId: T.Asset["assetId"]) => void;
  /** a save the reducer asked for (a completed upload's) failed */
  onRequestedSaveFailed: (error: unknown) => void;
}

/**
 * The query documents and scaffold one mounted editor surface holds for its
 * session. The host reads these for dirtiness walks and saves. The walk
 * itself is a pure function over the model.
 */
interface SessionSurface {
  sessionKey: () => SessionKey | null;
  scaffoldedBaseline: Ref<T.Asset | null>;
  template: () => T.Template | null;
}

/**
 * One host per page: the sessions model, its reducer, the per-session save
 * queues, and one shared save mutation. Query subscriptions live with the
 * mounted surfaces (see createSessionHandle), because Vue ties useQuery to
 * a component's setup scope. Each surface registers its documents here.
 */
export const createEditorHost = (handlers: EditorHostHandlers) => {
  const model = ref<EditorModel>(initialEditorModel);

  let isScopeDisposed = false;
  onScopeDispose(() => {
    isScopeDisposed = true;
  });

  const queryClient = useQueryClient();
  const updateAssetMutation = useUpdateAssetMutation();

  const surfaces = new Set<SessionSurface>();

  function registerSessionSurface(surface: SessionSurface): () => void {
    surfaces.add(surface);
    return () => {
      surfaces.delete(surface);
    };
  }

  function sessionSurfaceForKey(sessionKey: SessionKey): SessionSurface | null {
    for (const surface of surfaces) {
      if (surface.sessionKey() === sessionKey) return surface;
    }
    return null;
  }

  function dispatch(event: EditorEvent): void {
    const { model: nextModel, commands } = editorReducer(model.value, event);
    model.value = nextModel;
    // a session's save queue has nothing left to do once the session closed
    [...saveQueues.keys()].forEach((sessionKey) => {
      if (!nextModel.sessions[sessionKey]) saveQueues.delete(sessionKey);
    });
    commands?.forEach(runCommand);
  }

  function runCommand(command: EditorCommand): void {
    // a save's commands must not act on whatever page came next
    if (isScopeDisposed) return;
    switch (command.type) {
      case "notifyAssetCreated":
        // inline children's ids are adopted inside the reducer. Only the
        // page's own asset warrants navigation
        if (command.sessionKey === model.value.rootSessionKey) {
          handlers.onAssetCreated(command.assetId);
        }
        return;
      case "notifyCreateDropped":
        handlers.onCreateDropped(command.assetId);
        return;
      case "requestSave":
        // quiet like any save the user did not ask for: silent when it
        // works, surfaced when it fails
        void enqueueSessionSave(command.sessionKey).catch((error: unknown) => {
          if (!isScopeDisposed) handlers.onRequestedSaveFailed(error);
        });
        return;
    }
  }

  /** Whether this one session's own edits would change its stored asset. */
  function isSessionDirty(sessionKey: SessionKey): boolean {
    const surface = sessionSurfaceForKey(sessionKey);
    return selectHasUnsavedEdits(
      model.value,
      sessionKey,
      surface?.scaffoldedBaseline.value ?? null,
      surface?.template() ?? null
    );
  }

  /** Whether the session or anything mounted under it holds unsaved work. */
  function hasUnsavedChangesInTree(sessionKey: SessionKey): boolean {
    return selectSessionAndDescendantKeys(model.value, sessionKey).some(
      isSessionDirty
    );
  }

  // Serialize each session's saves so the assetId from its first CREATE is
  // written back before the next save reads it, preventing duplicate assets.
  const saveQueues = new Map<SessionKey, ReturnType<typeof createSaveQueue>>();

  function saveQueueFor(sessionKey: SessionKey) {
    let queue = saveQueues.get(sessionKey);
    if (!queue) {
      queue = createSaveQueue(() => sendSessionSave(sessionKey), 2000);
      saveQueues.set(sessionKey, queue);
    }
    return queue;
  }

  async function enqueueSessionSave(sessionKey: SessionKey): Promise<void> {
    await saveQueueFor(sessionKey).save();
  }

  async function waitForSessionSaveToSettle(
    sessionKey: SessionKey
  ): Promise<void> {
    await saveQueues.get(sessionKey)?.waitForCurrentSaveToSettle();
  }

  function directChildKeys(sessionKey: SessionKey): SessionKey[] {
    return Object.entries(model.value.sessions)
      .filter(([, session]) => session.parentLink?.sessionKey === sessionKey)
      .map(([key]) => key);
  }

  async function sendSessionSave(sessionKey: SessionKey): Promise<void> {
    // children first: a child's create lands in this same model as an
    // ordinary transition (stamping its id into this session's items), so
    // the snapshot below sees it without any tick-waiting
    const dirtyChildren = directChildKeys(sessionKey).filter(
      hasUnsavedChangesInTree
    );
    // settled, not all: a child that cannot be saved is independent of this
    // asset and must not cost the user their edits to it
    const childResults = await Promise.allSettled(
      dirtyChildren.map((childKey) => enqueueSessionSave(childKey))
    );
    childResults.forEach((result) => {
      if (result.status === "rejected" && !isScopeDisposed) {
        handlers.onChildSaveFailed(result.reason);
      }
    });

    const session = selectSession(model.value, sessionKey);
    // the session may have closed while its children saved. There is
    // nothing left to save and nothing was lost
    if (!session || !isSessionWithAsset(session)) return;

    const surface = sessionSurfaceForKey(sessionKey);
    const assetToSave = selectLocalAsset(
      model.value,
      sessionKey,
      surface?.scaffoldedBaseline.value ?? null
    );
    invariant(assetToSave, "Cannot save: the asset document is not loaded");
    const templateDocument = surface?.template() ?? null;
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

    if (session.status === "editingNewAsset") {
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
      const seededBaseline = toLocalAssetFromSavedAsset({
        template: templateDocument,
        savedAsset: echoedDraft,
      });

      // the scaffold is set by hand so the view has a baseline the moment
      // the session holds the new id, without waiting for the watcher
      if (surface) surface.scaffoldedBaseline.value = seededBaseline;
      dispatch({
        type: "assetCreated",
        sessionKey,
        baseline: seededBaseline,
        template: templateDocument,
      });
      queryClient.setQueryData(assetQuery(objectId).queryKey, seededBaseline);
      // the seed is the echo, not server truth: mark it stale so the
      // session's subscription reads back what the server actually stored
      // as soon as it observes the new key
      void queryClient.invalidateQueries({
        queryKey: assetQuery(objectId).queryKey,
      });
    } else {
      // the read-back arrives through the mutation's invalidation as
      // baselineRefreshed. This event only retires the regenerate requests
      // the save carried
      dispatch({
        type: "saveAccepted",
        sessionKey,
        template: templateDocument,
      });
    }
  }

  function reset(): void {
    dispatch({ type: "resetRequested" });
  }

  return {
    model,
    dispatch,
    registerSessionSurface,
    hasUnsavedChangesInTree,
    enqueueSessionSave,
    waitForSessionSaveToSettle,
    reset,
    saveStatus: updateAssetMutation.status,
  };
};

export type EditorHost = ReturnType<typeof createEditorHost>;

export type SessionHandleOptions =
  | { role: "root" }
  | { role: "child"; parentLink: ParentLink };

/**
 * One mounted editor surface's view of its session: the page's own form,
 * or one inline related asset. Owns the session's query subscriptions and
 * the scaffold watcher, and presents the same API the widget tree has
 * always injected.
 *
 * A root handle follows the model's rootSessionKey, which changes on every
 * opening. A child handle owns one fixed session for the component's life,
 * and unmounting closes it.
 */
export const createSessionHandle = (
  host: EditorHost,
  options: SessionHandleOptions
) => {
  const childSessionKey: SessionKey | null =
    options.role === "child" ? crypto.randomUUID() : null;
  const parentLink: ParentLink | null =
    options.role === "child" ? options.parentLink : null;

  const currentSessionKey = computed((): SessionKey | null =>
    options.role === "child" ? childSessionKey : host.model.value.rootSessionKey
  );

  const shellState = reactive<{ editorId: string }>({
    editorId: crypto.randomUUID(),
  });

  function dispatch(event: EditorEvent): void {
    host.dispatch(event);
  }

  function toError(cause: unknown): Error {
    return cause instanceof Error ? cause : new Error(String(cause));
  }

  const queryClient = useQueryClient();

  const editorAssetId = computed((): string | null =>
    selectAssetId(host.model.value, currentSessionKey.value)
  );

  // the asset baseline lives in the query cache, keyed by the id the
  // session names. staleTime Infinity: the baseline refreshes only on load
  // and on invalidation (a save's read-back, an inline child's save)
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
    selectTemplateId(
      host.model.value,
      currentSessionKey.value,
      rawBaseline.value
    )
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

  const unregisterSurface = host.registerSessionSurface({
    sessionKey: () => currentSessionKey.value,
    scaffoldedBaseline,
    template: () => template.value,
  });

  onScopeDispose(() => {
    unregisterSurface();
    if (childSessionKey) {
      dispatch({ type: "sessionClosed", sessionKey: childSessionKey });
    }
  });

  // the handle's one ongoing job: whatever changed the baseline document (a
  // save's read-back, an inline child's invalidation, a template swap),
  // scaffold it and hand it to the reducer as baselineRefreshed
  watch(
    [rawBaseline, template, currentSessionKey] as const,
    ([rawDocument, templateDocument, sessionKey]) => {
      const sessionAssetId = sessionKey
        ? selectAssetId(host.model.value, sessionKey)
        : null;
      if (!sessionKey || !sessionAssetId) {
        scaffoldedBaseline.value = null;
        return;
      }
      if (!rawDocument || !templateDocument) return;
      // the subscription can briefly hold the previous key's answer while
      // the session has moved on. A mismatched document must not scaffold
      if (rawDocument.assetId !== sessionAssetId) return;

      const sessionTemplateId = selectTemplateId(
        host.model.value,
        sessionKey,
        rawDocument
      );
      if (templateDocument.templateId !== sessionTemplateId) return;

      // the outgoing view donates uuids to contents that arrive without one
      // (position-inheritance for backends that do not store them), so the
      // items on screen keep their identities across the refresh
      const previousView = selectLocalAsset(
        host.model.value,
        sessionKey,
        scaffoldedBaseline.value
      );
      const nextBaseline = toLocalAssetFromSavedAsset({
        template: templateDocument,
        savedAsset: rawDocument,
        previousAsset: previousView,
      });
      scaffoldedBaseline.value = nextBaseline;
      dispatch({
        type: "baselineRefreshed",
        sessionKey,
        baseline: nextBaseline,
        template: templateDocument,
      });
    },
    { immediate: true }
  );

  const localAsset = computed((): T.Asset | T.UnsavedAsset | null =>
    selectLocalAsset(
      host.model.value,
      currentSessionKey.value,
      scaffoldedBaseline.value
    )
  );

  const savedAsset = computed((): T.Asset | null => {
    const sessionKey = currentSessionKey.value;
    const session = selectSession(host.model.value, sessionKey);
    if (session?.status !== "editingExistingAsset") return null;
    const baseline = scaffoldedBaseline.value;
    if (!baseline || baseline.assetId !== session.assetId) return null;
    return baseline;
  });

  const getWidgetInstanceId = (
    widgetId: T.WidgetDef["widgetId"]
  ): T.WidgetInstanceId => `${shellState.editorId}-${widgetId}`;

  const hasUnsavedChanges = computed(() => {
    const sessionKey = currentSessionKey.value;
    return sessionKey !== null && host.hasUnsavedChangesInTree(sessionKey);
  });

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

  /** A child reuses its one key. Each root opening takes a fresh one. */
  function mintSessionKey(): SessionKey {
    return childSessionKey ?? crypto.randomUUID();
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
    const sessionKey = mintSessionKey();
    dispatch({
      type: "newAssetRequested",
      sessionKey,
      parentLink,
      collectionId,
      templateId: requestedTemplateId,
    });

    try {
      const template = await fetchTemplateOrFail(requestedTemplateId);
      dispatch({
        type: "templateDocumentLoaded",
        sessionKey,
        templateId: requestedTemplateId,
        template,
      });
    } catch (cause) {
      const error = toError(cause);
      dispatch({
        type: "templateDocumentLoadFailed",
        sessionKey,
        templateId: requestedTemplateId,
        error,
      });
      throw error;
    }
  }

  /**
   * Initialize the editor with an existing asset by its ID.
   *
   * The session switches immediately. This function's job is to make sure
   * the documents the subscriptions render actually arrive, and to surface
   * a failure. A fetch that resolves after the session moved on dispatches
   * nothing on success, and its failure event carries a sessionKey the
   * model no longer holds.
   */
  async function initExistingAsset(
    assetId: T.Asset["assetId"],
    opts: { force?: boolean } = {}
  ): Promise<void> {
    if (
      selectAssetId(host.model.value, currentSessionKey.value) === assetId &&
      !opts.force
    ) {
      return;
    }

    const sessionKey = mintSessionKey();
    dispatch({
      type: "existingAssetRequested",
      sessionKey,
      parentLink,
      assetId,
    });

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
      dispatch({ type: "assetLoadFailed", sessionKey, error });
      throw error;
    }
  }

  async function saveAsset(): Promise<void> {
    const sessionKey = currentSessionKey.value;
    invariant(sessionKey, "Cannot save: no session is open");
    await host.enqueueSessionSave(sessionKey);
  }

  function updateCollection(collectionId: number): void {
    dispatchToSession((sessionKey) => ({
      type: "collectionChanged",
      sessionKey,
      collectionId,
    }));
  }

  /**
   * update the template in the state, and migrates the current local asset
   * to the new template.
   */
  async function migrateToTemplate(newTemplateId: number): Promise<void> {
    const sessionKey = currentSessionKey.value;
    invariant(sessionKey, "Cannot change template: no session is open");

    // a create still in flight transitions the session when it commits, and
    // a migration racing that transition would compute against the draft
    await host.waitForSessionSaveToSettle(sessionKey);

    const currentView = selectLocalAsset(
      host.model.value,
      sessionKey,
      scaffoldedBaseline.value
    );
    invariant(
      currentView,
      "Cannot change template: the asset document is not loaded"
    );

    if (currentView.templateId === newTemplateId) {
      return;
    }

    dispatch({
      type: "templateMigrationRequested",
      sessionKey,
      templateId: newTemplateId,
    });

    try {
      const template = await fetchTemplateOrFail(newTemplateId);
      dispatch({
        type: "templateMigrated",
        sessionKey,
        templateId: newTemplateId,
        template,
        baseline: scaffoldedBaseline.value,
      });
    } catch (cause) {
      const error = toError(cause);
      dispatch({
        type: "templateMigrationFailed",
        sessionKey,
        templateId: newTemplateId,
        error,
      });
      throw error;
    }
  }

  /**
   * Events that only make sense with an open session are dropped without one.
   */
  function dispatchToSession(
    makeEvent: (sessionKey: SessionKey) => EditorEvent
  ): void {
    const sessionKey = currentSessionKey.value;
    if (!sessionKey) return;
    dispatch(makeEvent(sessionKey));
  }

  function updateWidgetContents(
    fieldTitle: T.WidgetDef["fieldTitle"],
    contents: T.WidgetContent[]
  ): void {
    dispatchToSession((sessionKey) => ({
      type: "widgetContentsEdited",
      sessionKey,
      fieldTitle,
      contents,
    }));
  }

  /**
   * Record a finished upload's items. The reducer answers with a save
   * request, so the uploaded file is never left without a saved asset
   * referencing it.
   */
  function recordCompletedUpload(
    fieldTitle: T.WidgetDef["fieldTitle"],
    contents: T.WidgetContent[]
  ): void {
    dispatchToSession((sessionKey) => ({
      type: "uploadCompleted",
      sessionKey,
      fieldTitle,
      contents,
    }));
  }

  function updateReadyForDisplay(readyForDisplay: boolean): void {
    dispatchToSession((sessionKey) => ({
      type: "readyForDisplayChanged",
      sessionKey,
      readyForDisplay,
    }));
  }

  function updateAvailableAfter(availableAfter: T.PHPDateTime | null): void {
    dispatchToSession((sessionKey) => ({
      type: "availableAfterChanged",
      sessionKey,
      availableAfter,
    }));
  }

  // wrapping in reactive to auto-unwrap refs
  return reactive({
    sessionKey: currentSessionKey,
    localAsset,
    savedAsset,
    template,
    status: computed(
      () =>
        selectSession(host.model.value, currentSessionKey.value)?.status ??
        "idle"
    ),
    // "the editor has an asset to show": for an existing asset this waits
    // for the baseline document, so pages render their loading state until
    // localAsset is real
    hasAssetToEdit: computed((): boolean => localAsset.value !== null),
    templateId,
    collectionId: computed(() => localAsset.value?.collectionId ?? null),
    hasUnsavedChanges,
    loadError: computed(() =>
      selectLoadError(host.model.value, currentSessionKey.value)
    ),
    saveAssetIndicator: host.saveStatus,
    reset: host.reset,
    initNewAsset,
    initExistingAsset,
    saveAsset,
    migrateToTemplate,
    updateCollection,
    updateWidgetContents,
    recordCompletedUpload,
    updateReadyForDisplay,
    updateAvailableAfter,
    getWidgetInstanceId,
  });
};

export type AssetEditor = ReturnType<typeof createSessionHandle>;

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

/**
 * Injects the page's editor host, which owns the model every session shares.
 */
export const useEditorHost = (): EditorHost => {
  const host = inject(EDITOR_HOST_PROVIDE_KEY);
  if (!host) {
    throw new Error("useEditorHost must be called within an editor page");
  }
  return host;
};
