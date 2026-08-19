/**
 * The component-facing surface of the asset editor. One editor per open
 * asset: the page provides the root editor, and each mounted inline
 * related asset provides its own on the same shared editor context.
 *
 * Every read is a selector over the state and every method is a dispatch,
 * so this file holds no editor state of its own. The state lives in
 * types.ts, the transitions in update.ts, and the network in
 * effectRunner.ts.
 */

import * as T from "@/types";
import {
  computed,
  inject,
  InjectionKey,
  onUnmounted,
  provide,
  reactive,
  ref,
  shallowRef,
  ShallowRef,
} from "vue";
import { useQueryClient } from "@tanstack/vue-query";
import invariant from "tiny-invariant";
import {
  ASSET_EDITOR_PROVIDE_KEY,
  ASSET_VALIDATION_PROVIDE_KEY,
} from "@/constants/constants";
import {
  Dispatch,
  EditSessionKey,
  EditorEvent,
  EditorState,
  ParentLink,
  SaveState,
  initialEditorState,
} from "./types";
import { update } from "./update";
import {
  selectHasUnsavedEdits,
  selectKeyAndDescendants,
  selectLoadError,
  selectLocalAsset,
  selectOpenAsset,
  selectSaveState,
  selectSavedAsset,
  selectStatus,
  selectTemplate,
  selectTemplateId,
} from "./selectors";
import {
  createEffectRunner,
  EffectRunner,
  EditorPageHandlers,
} from "./effectRunner";
import { createAssetValidation } from "./useAssetValidation";

interface EditorContext {
  state: ShallowRef<EditorState>;
  dispatch: Dispatch<EditorEvent>;
  effectRunner: EffectRunner;
}

const EDITOR_CONTEXT_PROVIDE_KEY = Symbol() as InjectionKey<EditorContext>;

export type ProvideAssetEditorOptions =
  | { role: "root"; handlers: EditorPageHandlers }
  | { role: "child"; parentLink: ParentLink };

export type AssetEditor = ReturnType<typeof provideAssetEditor>;

export function provideAssetEditor(options: ProvideAssetEditorOptions) {
  const context =
    options.role === "root"
      ? createEditorContext(options.handlers)
      : injectEditorContext();
  if (options.role === "root") {
    provide(EDITOR_CONTEXT_PROVIDE_KEY, context);
  }

  const { effectRunner } = context;
  const parentLink = options.role === "child" ? options.parentLink : null;

  // created fresh per opened asset, so a response from a previous opening
  // can never write into the current one: distinct keys are distinct slots
  const currentKey = ref<EditSessionKey | null>(null);

  const state = () => context.state.value;
  const dispatch = (event: EditorEvent) => context.dispatch(event);

  function openedKey(): EditSessionKey {
    invariant(currentKey.value, "no asset is open in this editor");
    return currentKey.value;
  }

  function initNewAsset({
    templateId,
    collectionId,
  }: {
    templateId: number;
    collectionId: number;
  }): Promise<void> {
    const key = crypto.randomUUID();
    const settled = effectRunner.whenTemplateSettles(key, templateId);
    dispatch({
      type: "newAssetRequested",
      key,
      parentLink,
      collectionId,
      templateId,
    });
    currentKey.value = key;
    return settled;
  }

  function initExistingAsset(
    assetId: string,
    { force = false }: { force?: boolean } = {}
  ): Promise<void> {
    // already editing this asset: reopening would throw away unsaved work,
    // and the create flow calls this when the page url moves to the new id
    const openAsset = selectOpenAsset(state(), currentKey.value);
    const isAlreadyOpen =
      openAsset?.status === "editingExistingAsset" &&
      openAsset.assetId === assetId;
    if (isAlreadyOpen && !force) return Promise.resolve();

    const key = crypto.randomUUID();
    const settled = effectRunner.whenAssetAndTemplateSettles(key);
    dispatch({ type: "existingAssetRequested", key, parentLink, assetId });
    currentKey.value = key;
    return settled;
  }

  async function migrateToTemplate(templateId: number): Promise<void> {
    const key = openedKey();
    // a migration diffs against the saved asset, so it must not interleave
    // with a save that is about to replace that saved asset
    await effectRunner.saveQueueFor(key).waitForCurrentSaveToSettle();
    const settled = effectRunner.whenTemplateSettles(key, templateId);
    dispatch({ type: "templateMigrationRequested", key, templateId });
    return settled;
  }

  function getWidgetInstanceId(
    widgetId: T.WidgetDef["widgetId"]
  ): T.WidgetInstanceId {
    return `${openedKey()}-${widgetId}`;
  }

  const editor = reactive({
    editSessionKey: computed(() => currentKey.value),
    status: computed(() => selectStatus(state(), currentKey.value)),
    localAsset: computed(() => selectLocalAsset(state(), currentKey.value)),
    savedAsset: computed(() => selectSavedAsset(state(), currentKey.value)),
    template: computed(() => selectTemplate(state(), currentKey.value)),
    templateId: computed(() => selectTemplateId(state(), currentKey.value)),
    collectionId: computed(
      () => selectLocalAsset(state(), currentKey.value)?.collectionId ?? null
    ),
    loadError: computed(() => selectLoadError(state(), currentKey.value)),
    hasAssetToEdit: computed(
      () => selectLocalAsset(state(), currentKey.value) !== null
    ),
    saveAssetIndicator: computed<SaveState>(() =>
      selectSaveState(state(), currentKey.value)
    ),
    /** This editor's asset and every inline child mounted under it. */
    hasUnsavedChanges: computed(() => {
      if (!currentKey.value) return false;
      return selectKeyAndDescendants(state(), currentKey.value).some((key) =>
        selectHasUnsavedEdits(state(), key)
      );
    }),

    initNewAsset,
    initExistingAsset,
    migrateToTemplate,
    getWidgetInstanceId,
    saveAsset(): Promise<void> {
      return effectRunner.saveQueueFor(openedKey()).save();
    },
    updateWidgetContents(
      fieldTitle: T.WidgetDef["fieldTitle"],
      contents: T.WidgetContent[]
    ): void {
      dispatch({
        type: "widgetContentsEdited",
        key: openedKey(),
        fieldTitle,
        contents,
      });
    },
    recordCompletedUpload(
      fieldTitle: T.WidgetDef["fieldTitle"],
      contents: T.WidgetContent[]
    ): void {
      dispatch({
        type: "uploadCompleted",
        key: openedKey(),
        fieldTitle,
        contents,
      });
    },
    updateCollection(collectionId: number): void {
      dispatch({ type: "collectionChanged", key: openedKey(), collectionId });
    },
    updateReadyForDisplay(readyForDisplay: boolean): void {
      dispatch({
        type: "readyForDisplayChanged",
        key: openedKey(),
        readyForDisplay,
      });
    },
    updateAvailableAfter(availableAfter: T.PHPDateTime | null): void {
      dispatch({
        type: "availableAfterChanged",
        key: openedKey(),
        availableAfter,
      });
    },
    reset(): void {
      dispatch({ type: "resetRequested" });
      currentKey.value = null;
    },
  });

  // a closed editor's open asset leaves the state, so work that finishes
  // after the unmount finds no open asset to write into
  onUnmounted(() => {
    if (currentKey.value) {
      dispatch({ type: "closed", key: currentKey.value });
    }
  });

  provide(ASSET_EDITOR_PROVIDE_KEY, editor);
  provide(
    ASSET_VALIDATION_PROVIDE_KEY,
    createAssetValidation(
      () => editor.localAsset,
      () => editor.template,
      getWidgetInstanceId
    )
  );

  return editor;
}

export function useAssetEditor(): AssetEditor {
  const editor = inject(ASSET_EDITOR_PROVIDE_KEY);
  invariant(
    editor,
    "useAssetEditor must be called under a component that called provideAssetEditor"
  );
  return editor;
}

function createEditorContext(handlers: EditorPageHandlers): EditorContext {
  const queryClient = useQueryClient();
  const state = shallowRef(initialEditorState) as ShallowRef<EditorState>;
  const effectRunner = createEffectRunner({
    queryClient,
    handlers,
    getState: () => state.value,
    dispatch: (event) => dispatch(event),
  });

  function dispatch(event: EditorEvent): void {
    const step = update(state.value, event, {
      createUuid: () => crypto.randomUUID(),
    });
    state.value = step.state;
    // effects wait for a microtask so the state swap happens first, and so
    // an effect's own dispatches stack after this one instead of inside it
    step.effects?.forEach((effect) => {
      queueMicrotask(() => effectRunner.runEffect(effect));
    });
  }

  return { state, dispatch, effectRunner };
}

function injectEditorContext(): EditorContext {
  const context = inject(EDITOR_CONTEXT_PROVIDE_KEY);
  invariant(
    context,
    "an inline asset editor must mount under the page that provides the editor context"
  );
  return context;
}
