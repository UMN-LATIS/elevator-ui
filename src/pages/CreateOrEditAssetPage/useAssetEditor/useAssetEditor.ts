import { computed, watch, ref, MaybeRefOrGetter, toValue, toRef } from "vue";
import { useAssetQuery } from "@/queries/useAssetQuery";
import { useTemplateQuery } from "@/queries/useTemplateQuery";
import { useUpdateAssetMutation } from "@/queries/useUpdateAssetMutation";
import { useInstanceStore } from "@/stores/instanceStore";
import {
  toSaveableFormData,
  doAllRequiredHaveContent,
  makeLocalAsset,
  hasAssetChanged as hasAssetChangedPure,
} from "./utils";
import type {
  Asset,
  UnsavedAsset,
  ApiAssetSubmissionResponse,
  TextWidgetContent,
  SelectOption,
} from "@/types";
import invariant from "tiny-invariant";
import { MutationStatus } from "@tanstack/vue-query";

export const useAssetEditor = (assetId: MaybeRefOrGetter<string | null>) => {
  const instanceStore = useInstanceStore();

  // Reactive state
  const localAsset = ref<Asset | UnsavedAsset | null>(null);
  const hasInitialized = ref(false);
  const selectedTemplateId = ref<number | null>(null);
  const selectedCollectionId = ref<number | null>(null);
  const saveAssetStatus = ref<MutationStatus>("idle");

  // Queries
  const {
    data: savedAsset,
    error: assetError,
    isLoading: isSavedAssetLoading,
  } = useAssetQuery(assetId, {
    enabled: () => !!toValue(assetId),
  });

  // queries
  const {
    data: template,
    isLoading: isTemplateLoading,
    error: templateError,
  } = useTemplateQuery(selectedTemplateId, {
    enabled: () => selectedTemplateId.value !== null,
    experimental_prefetchInRender: true,
  });

  const { mutateAsync: saveAssetMut } = useUpdateAssetMutation();

  // computed
  const templateOptions = computed((): SelectOption<number>[] => {
    const templates = instanceStore.instance.templates ?? [];
    return templates.map((template) => ({
      label: template.name,
      id: template.id,
    }));
  });

  const collectionOptions = computed((): SelectOption<number>[] => {
    const collections = instanceStore.collections ?? [];
    return collections.map((collection) => ({
      label: collection.title,
      id: collection.id,
    }));
  });

  const isCreateMode = computed(() => !savedAsset.value?.assetId);

  const savedAssetTitle = computed(
    () => savedAsset.value?.title?.[0] ?? savedAsset.value?.assetId ?? ""
  );

  const localAssetTitle = computed(() => {
    if (!localAsset.value) return "";
    const localTitle = localAsset.value.title?.[0];

    // if there's no title set, try the title widget
    const titleWidget = (localAsset.value.title_1 as TextWidgetContent[]) || [];
    const localTitleWidgetContent = titleWidget?.[0]?.fieldContents;

    return localTitle || localTitleWidgetContent || "";
  });

  const hasAssetChanged = computed(() => {
    if (!localAsset.value || !template.value) return false;

    return hasAssetChangedPure({
      localAsset: localAsset.value,
      savedAsset: savedAsset.value,
      template: template.value,
    });
  });

  const isFormValid = computed(() => {
    if (!template.value || !localAsset.value) return false;
    return doAllRequiredHaveContent(localAsset.value, template.value);
  });

  // Initialize asset when data is available (only for edit mode)
  watch(
    [savedAsset, template],
    async () => {
      // For create mode, don't auto-initialize - wait for user to click Continue
      if (!toValue(assetId) || !savedAsset.value || hasInitialized.value) {
        return;
      }

      // if asset is loaded, we can initialize the collection and template id
      selectedCollectionId.value = savedAsset.value.collectionId;
      selectedTemplateId.value = savedAsset.value.templateId;

      // if the loaded template is different from the selected one,
      // we can't do anything more yet
      if (template.value?.templateId !== selectedTemplateId.value) {
        return;
      }

      localAsset.value = makeLocalAsset({
        template: template.value,
        collectionId: selectedCollectionId.value,
        savedAsset: savedAsset.value,
      });
      hasInitialized.value = true;
    },
    { immediate: true }
  );

  // Actions
  function initNewAsset() {
    // ensure all our assumptions are met before initializing
    invariant(
      template.value,
      "Cannot initialize asset without a loaded template"
    );
    invariant(
      selectedCollectionId.value,
      "Cannot initialize asset without a selected collection"
    );
    invariant(!hasInitialized.value, "Asset editor already initialized");
    invariant(!localAsset.value, "Cannot initialize: asset already exists");
    invariant(isCreateMode.value, "Cannot initialize: this is not create mode");
    invariant(
      selectedTemplateId.value === template.value.templateId,
      "Template ID mismatch"
    );

    localAsset.value = makeLocalAsset({
      template: template.value,
      collectionId: selectedCollectionId.value,
      savedAsset: null,
    });

    hasInitialized.value = true;
  }

  async function saveAsset(): Promise<ApiAssetSubmissionResponse> {
    invariant(localAsset.value, "Cannot save: no asset.");
    invariant(template.value, "Cannot save: no template.");

    saveAssetStatus.value = "pending";

    const formData = toSaveableFormData(localAsset.value, template.value);

    try {
      const data = await saveAssetMut(formData);
      invariant(data, "Expected data to be defined after saveAsset");

      saveAssetStatus.value = "success";
      setTimeout(() => {
        saveAssetStatus.value = "idle"; // Reset status after a delay
      }, 3000);

      // For create mode, the server only returns objectId, so update the local asset's ID
      if (
        isCreateMode.value &&
        data &&
        typeof data === "object" &&
        "objectId" in data &&
        localAsset.value
      ) {
        const objectId = (data as { objectId: string }).objectId;
        localAsset.value.assetId = objectId;
      }

      return data;
    } catch (error) {
      saveAssetStatus.value = "error";
      console.error("Failed to save asset:", error);
      setTimeout(() => {
        saveAssetStatus.value = "idle"; // Reset status after a delay
      }, 10000);
      throw error;
    }
  }

  function updateTemplateId(newTemplateId: number) {
    invariant(localAsset.value, "Cannot change template: no asset.");

    const updatedAsset = { ...localAsset.value, templateId: newTemplateId };
    updateLocalAsset(updatedAsset);
    return saveAsset();
  }

  async function migrateCollection(
    newCollectionId: number
  ): Promise<ApiAssetSubmissionResponse> {
    invariant(localAsset.value, "Cannot change collection: no asset.");

    const updatedAsset = { ...localAsset.value, collectionId: newCollectionId };
    updateLocalAsset(updatedAsset);

    return saveAsset();
  }

  function updateLocalAsset(updatedAsset: Asset | UnsavedAsset) {
    localAsset.value = updatedAsset;
  }

  function resetEditor() {
    localAsset.value = null;
    hasInitialized.value = false;
    selectedTemplateId.value = null;
    selectedCollectionId.value = null;
    saveAssetStatus.value = "idle";
  }

  watch(toRef(assetId), (newAssetId) => {
    // if assetId matches current asset, skip reset to avoid flash
    if (newAssetId === localAsset.value?.assetId) {
      return;
    }

    resetEditor();
  });

  return {
    // State
    localAsset,
    savedAsset,
    template,
    hasInitialized,
    selectedTemplateId,
    selectedCollectionId,

    // Computed
    isCreateMode,
    hasAssetChanged,
    isFormValid,
    savedAssetTitle,
    localAssetTitle,

    // Query status
    isTemplateLoading,
    templateError,
    isSavedAssetLoading,
    saveAssetStatus,
    assetError,

    // Options
    templateOptions,
    collectionOptions,

    // Actions
    initNewAsset,
    saveAsset,
    updateTemplateId,
    migrateCollection,
    resetEditor,
    updateLocalAsset,
  };
};
