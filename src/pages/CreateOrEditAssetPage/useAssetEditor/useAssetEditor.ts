import { computed, watch, ref } from "vue";
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
  Template,
  ApiAssetSubmissionResponse,
  TextWidgetContent,
} from "@/types";
import invariant from "tiny-invariant";
import { MutationStatus } from "@tanstack/vue-query";

export const useAssetEditor = (assetId: () => string | null) => {
  const instanceStore = useInstanceStore();

  // Reactive state
  const localAsset = ref<Asset | UnsavedAsset | null>(null);
  const hasInitialized = ref(false);
  const selectedTemplateId = ref("");
  const selectedCollectionId = ref("");
  const saveAssetStatus = ref<MutationStatus>("idle");

  // Queries
  const { data: savedAsset, error: assetError } = useAssetQuery(assetId, {
    enabled: () => !!assetId(),
  });

  const safeParseInt = (val: unknown): number | null => {
    if (typeof val === "string" || typeof val === "number") {
      const parsed = Number.parseInt(val as string, 10);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
  };

  const savedTemplateId = computed((): number | null => {
    const assetTemplateId = savedAsset.value?.templateId;
    const initialId = selectedTemplateId.value;

    // For asset editing, use the asset's template ID
    if (assetTemplateId) return safeParseInt(assetTemplateId);

    // For asset creation, convert string ID to number
    if (initialId) return safeParseInt(initialId);

    return null;
  });

  // queries
  const {
    data: template,
    isLoading: isTemplateLoading,
    error: templateError,
  } = useTemplateQuery(savedTemplateId, {
    enabled: () => savedTemplateId.value !== null,
  });

  const { mutate: saveAsset } = useUpdateAssetMutation();

  // computed
  const templateOptions = computed(() => {
    const templates = instanceStore.instance.templates ?? [];
    return templates.map((template) => ({
      label: template.name,
      id: template.id.toString(),
    }));
  });

  const defaultTemplateId = computed(() => {
    return templateOptions.value.length === 1
      ? templateOptions.value[0].id
      : "";
  });

  const collectionOptions = computed(() => {
    const collections = instanceStore.collections ?? [];
    return collections.map((collection) => ({
      label: collection.title,
      id: collection.id.toString(),
    }));
  });

  const defaultCollectionId = computed(() => {
    return collectionOptions.value.length === 1
      ? collectionOptions.value[0].id
      : "";
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

  const isLoading = computed(() => {
    // Loading if we're waiting for template or if we haven't initialized yet
    return isTemplateLoading.value || (!!assetId() && !hasInitialized.value);
  });

  // Auto-set initial values when defaults are available for create mode
  watch(
    [defaultTemplateId, defaultCollectionId],
    ([newTemplateId, newCollectionId]) => {
      if (!assetId() && newTemplateId && newCollectionId) {
        if (!selectedTemplateId.value) {
          selectedTemplateId.value = newTemplateId;
        }
        if (!selectedCollectionId.value) {
          selectedCollectionId.value = newCollectionId;
        }
      }
    },
    { immediate: true }
  );

  // Initialize asset when data is available (only for edit mode)
  watch(
    [savedAsset, template],
    ([newAsset, newTemplate]) => {
      // For create mode, don't auto-initialize - wait for user to click Continue
      if (!assetId()) return;

      if (!newTemplate) return;

      const collectionId = Number.parseInt(
        selectedCollectionId.value || defaultCollectionId.value
      );

      // Only initialize if we haven't yet, or if asset ID changed (create -> edit transition)
      const shouldInitialize =
        !hasInitialized.value ||
        !localAsset.value ||
        newAsset?.assetId !== savedAsset.value?.assetId;

      if (shouldInitialize) {
        initializeAsset(newTemplate, collectionId, newAsset || null);
      }
    },
    { immediate: true }
  );

  // Actions
  function initAsset() {
    invariant(
      template.value,
      "Cannot initialize asset without a loaded template"
    );

    const collectionId = Number.parseInt(
      selectedCollectionId.value || defaultCollectionId.value
    );

    initializeAsset(template.value, collectionId, savedAsset.value || null);
  }

  function handleSaveAsset(
    onSuccess?: (data: ApiAssetSubmissionResponse) => void
  ) {
    invariant(localAsset.value, "Cannot save: no asset.");
    invariant(template.value, "Cannot save: no template.");
    saveAssetStatus.value = "pending";

    const formData = toSaveableFormData(localAsset.value, template.value);

    saveAsset(formData, {
      onSuccess: (data) => {
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

        onSuccess?.(data);
      },
      onError: (error) => {
        saveAssetStatus.value = "error";
        console.error("Failed to save asset:", error);
        setTimeout(() => {
          saveAssetStatus.value = "idle"; // Reset status after a delay
        }, 10000);
      },
    });
  }

  function handleConfirmedTemplateIdUpdate(newTemplateId: number) {
    invariant(localAsset.value, "Cannot change template: no asset.");

    const updatedAsset = { ...localAsset.value, templateId: newTemplateId };
    updateLocalAsset(updatedAsset);
    handleSaveAsset();
  }

  function handleMigrateCollection(
    newCollectionId: number,
    onSuccess?: () => void
  ) {
    invariant(localAsset.value, "Cannot change collection: no asset.");

    const updatedAsset = { ...localAsset.value, collectionId: newCollectionId };
    updateLocalAsset(updatedAsset);

    handleSaveAsset(onSuccess);
  }

  function setInitialValues(templateId: string, collectionId: string) {
    selectedTemplateId.value = templateId || defaultTemplateId.value;
    selectedCollectionId.value = collectionId || defaultCollectionId.value;
  }

  // Local actions - moved from store
  function initializeAsset(
    templateData: Template,
    collectionId: number,
    existingAsset?: Asset | null
  ) {
    localAsset.value = makeLocalAsset({
      template: templateData,
      collectionId,
      savedAsset: existingAsset || null,
    });

    hasInitialized.value = true;
  }

  function updateLocalAsset(updatedAsset: Asset | UnsavedAsset) {
    localAsset.value = updatedAsset;
  }

  function resetEditor() {
    localAsset.value = null;
    hasInitialized.value = false;
    selectedTemplateId.value = "";
    selectedCollectionId.value = "";
    saveAssetStatus.value = "idle";
  }

  return {
    // State
    localAsset,
    savedAsset,
    template,
    hasInitialized,
    selectedTemplateId: selectedTemplateId,
    selectedCollectionId: selectedCollectionId,

    // Computed
    isCreateMode,
    hasAssetChanged,
    isFormValid,
    isLoading,
    isTemplateLoading,
    savedAssetTitle,
    localAssetTitle,

    // Query status
    assetError,
    templateError,
    saveAssetStatus,

    // Options
    templateOptions,
    collectionOptions,
    defaultTemplateId,
    defaultCollectionId,

    // Actions
    initAsset,
    handleSaveAsset,
    handleConfirmedTemplateIdUpdate,
    handleMigrateCollection,
    setInitialValues,
    resetEditor,
    updateLocalAsset,
  };
};
