import { reactive, computed, readonly, watchEffect } from "vue";
import { watchDebounced } from "@vueuse/core";
import { useAssetQuery } from "@/queries/useAssetQuery";
import { useTemplateQuery } from "@/queries/useTemplateQuery";
import { useUpdateAssetMutation } from "@/queries/useUpdateAssetMutation";
import { useInstanceStore } from "@/stores/instanceStore";
import { toSaveableFormData } from "./utils";
import type {
  Asset,
  UnsavedAsset,
  Template,
  ApiAssetSubmissionResponse,
  TextWidgetContent,
} from "@/types";
import {
  initialState,
  reduce,
  type EditorEvent,
  type Effect,
} from "./editor.model";

export function useAssetEditor(assetId: () => string | null) {
  const instanceStore = useInstanceStore();

  const state = reactive(initialState());

  /**
   * Dispatch - sends all state changes go through pure reducer
   */
  const dispatch = (event: EditorEvent): void => {
    const [nextState, effect] = reduce(state, event);
    Object.assign(state, nextState);
    runEffect(effect);
  };

  // Server queries
  const { error: assetError } = useAssetQuery(assetId, {
    enabled: () => !!assetId(),
    onSuccess: (saved: Asset | null) =>
      dispatch({
        type: "LOAD_SAVED_ASSET_SUCCESS",
        saved: saved ?? null,
      }),
  });

  const templateId = computed(() => {
    const selected = state.selectedTemplateId;
    const savedId = state.savedAsset?.templateId;
    // Use saved asset's template ID if editing, otherwise use selected ID
    const effectiveId = savedId ?? (selected === "" ? null : selected);
    return effectiveId;
  });

  const { isLoading: isTemplateLoading, error: templateError } =
    useTemplateQuery(templateId, {
      enabled: () => templateId.value !== null,
      onSuccess: (template: Template) =>
        template &&
        dispatch({
          type: "LOAD_TEMPLATE_SUCCESS",
          template,
        }),
    });

  const { mutate: saveAssetMutation } = useUpdateAssetMutation();

  /**
   * Effect executor - declarative side effects based on reducer commands
   */
  const runEffect = (effect: Effect): void => {
    if (effect.kind === "save") {
      if (!state.localAsset || !state.template) return;

      const formData = toSaveableFormData(state.localAsset, state.template);
      saveAssetMutation(formData, {
        onSuccess: (res: ApiAssetSubmissionResponse) =>
          dispatch({
            type: "SAVE_SUCCESS",
            saved: res,
          }),
        onError: (error: unknown) => {
          const message =
            error instanceof Error ? error.message : "Save failed";
          dispatch({
            type: "SAVE_FAILURE",
            message,
          });
        },
      });
    }
  };

  // Options for template/collection selects
  const templateOptions = computed(() => {
    const templates = instanceStore.instance.templates ?? [];
    return templates.map((template) => ({
      label: template.name,
      id: template.id.toString(), // Convert to string for SelectGroup
    }));
  });

  const collectionOptions = computed(() => {
    const collections = instanceStore.collections ?? [];
    return collections.map((collection) => ({
      label: collection.title,
      id: collection.id.toString(), // Convert to string for SelectGroup
    }));
  });

  const defaultTemplateId = computed((): string => {
    return templateOptions.value.length === 1
      ? templateOptions.value[0].id
      : "";
  });

  const defaultCollectionId = computed((): string => {
    return collectionOptions.value.length === 1
      ? collectionOptions.value[0].id
      : "";
  });

  // Initialize with defaults when available (create mode)
  const shouldInitialize = computed(() => {
    return (
      state.status === "idle" &&
      !assetId() &&
      defaultTemplateId.value &&
      defaultCollectionId.value
    );
  });

  const formStatus = computed(() => state.status);

  // Auto-initialize for create mode
  watchEffect(() => {
    if (!shouldInitialize.value) return;

    if (defaultTemplateId.value) {
      dispatch({
        type: "SET_TEMPLATE",
        id: Number.parseInt(defaultTemplateId.value),
      });
    }

    if (defaultCollectionId.value) {
      dispatch({
        type: "SET_COLLECTION",
        id: Number.parseInt(defaultCollectionId.value),
      });
    }
  });

  // Derived computed properties
  const isCreateMode = computed(() => !state.savedAsset?.assetId);

  const savedAssetTitle = computed(() => {
    return state.savedAsset?.title?.[0] ?? state.savedAsset?.assetId ?? "";
  });

  const localAssetTitle = computed(() => {
    if (!state.localAsset) return "";

    const localTitle = state.localAsset.title?.[0];
    const titleWidget = (state.localAsset as Record<string, unknown>).title_1;
    const titleWidgetArray = Array.isArray(titleWidget)
      ? (titleWidget as TextWidgetContent[])
      : [];
    const localTitleWidgetContent = titleWidgetArray[0]?.fieldContents;
    return localTitle || localTitleWidgetContent || "";
  });

  const isLoading = computed(() => {
    return isTemplateLoading.value || state.status === "initializing";
  });

  // Single autosave effect - replaces complex watchers with simple reactivity
  const shouldAutosave = computed(() => {
    return state.status === "editing" && state.isDirty && state.isValid;
  });

  watchDebounced(
    shouldAutosave,
    (should: boolean) => should && dispatch({ type: "REQUEST_SAVE" }),
    { debounce: 500, maxWait: 2000 }
  );

  /** Set the selected template ID and trigger template loading */
  const setTemplate = (id: number): void =>
    dispatch({ type: "SET_TEMPLATE", id });

  /** Set the selected collection ID */
  const setCollection = (id: number): void =>
    dispatch({ type: "SET_COLLECTION", id });

  /** Update the local asset data */
  const updateLocalAsset = (asset: Asset | UnsavedAsset): void =>
    dispatch({ type: "UPDATE_LOCAL_ASSET", asset });

  /** Trigger a save operation (with autosave debouncing) */
  const save = (): void => dispatch({ type: "REQUEST_SAVE" });

  /** Reset the editor to initial state */
  const reset = (): void => dispatch({ type: "RESET" });

  /**
   * Promise-based save for special cases (redirects, etc)
   */
  const saveAndWait = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      save();

      // Watch for status changes to resolve or reject
      const unwatch = watchDebounced(
        () => state.status,
        (status: string) => {
          if (status === "editing") {
            unwatch();
            resolve();
          } else if (status === "error") {
            unwatch();
            reject(new Error(state.error || "Save failed"));
          }
        },
        { debounce: 50 }
      );
    });
  };

  return {
    // State - single source of truth
    state: readonly(state),

    // Computed properties
    isCreateMode,
    isLoading,
    savedAssetTitle,
    localAssetTitle,
    formStatus,

    // State getters - clean computed access
    localAsset: computed(() => state.localAsset),
    template: computed(() => state.template),
    selectedTemplateId: computed((): number | "" => state.selectedTemplateId),
    selectedCollectionId: computed(
      (): number | "" => state.selectedCollectionId
    ),
    isDirty: computed(() => state.isDirty),
    isValid: computed(() => state.isValid),
    hasError: computed(() => state.status === "error"),
    isSaving: computed(() => state.status === "saving"),
    error: computed(() => state.error),

    // Query status
    assetError,
    templateError,
    isTemplateLoading,

    // Options for selects
    templateOptions,
    collectionOptions,
    defaultTemplateId,
    defaultCollectionId,

    // Actions - clean, intentional API
    setTemplate,
    setCollection,
    updateLocalAsset,
    save,
    saveAndWait,
    reset,
  } as const;
}
