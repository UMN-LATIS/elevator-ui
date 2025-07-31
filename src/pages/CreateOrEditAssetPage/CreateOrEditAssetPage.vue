<template>
  <DefaultLayout>
    <form
      v-if="!assetId && !localAsset"
      class="flex flex-col gap-4 w-full max-w-sm mx-auto mt-12 bg-white rounded-md border border-neutral-900 p-4"
      @submit.prevent>
      <SelectGroup
        :modelValue="selectedTemplateId"
        :options="templateOptions"
        label="Template"
        required
        @update:modelValue="(value: number) =>  setTemplate(value)" />
      <SelectGroup
        :modelValue="selectedCollectionId"
        :options="collectionOptions"
        label="Collection"
        required
        @update:modelValue="(value: number) => setCollection(value)" />

      <Button
        type="button"
        variant="primary"
        class="block my-4 w-full"
        :disabled="!selectedTemplateId || !selectedCollectionId"
        @click="handleContinue">
        Continue
        <SpinnerIcon v-if="isTemplateLoading" />
      </Button>
    </form>
    <div v-else-if="isLoading" class="flex justify-center items-center py-12">
      <SpinnerIcon class="w-8 h-8 animate-spin" />
      <span class="ml-2">
        Loading... (T: {{ selectedTemplateId }}, C: {{ selectedCollectionId }},
        hasTemplate: {{ !!template }}, hasAsset: {{ !!localAsset }})
      </span>
    </div>
    <Transition v-else-if="localAsset && template" name="fade">
      <EditAssetForm
        :template="template"
        :asset="localAsset"
        :savedAssetTitle="savedAssetTitle"
        :localAssetTitle="localAssetTitle"
        :saveStatus="isSaving ? 'pending' : 'idle'"
        :hasUnsavedChanges="isDirty"
        :isValid="isValid"
        class="flex-1"
        @update:templateId="handleUpdateTemplateId($event)"
        @migrateCollection="handleMigrateCollection($event)"
        @save="handleSaveAsset"
        @update:asset="updateLocalAsset($event)" />
    </Transition>
    <div
      v-else-if="selectedTemplateId && selectedCollectionId"
      class="flex justify-center items-center py-12">
      <SpinnerIcon class="w-8 h-8 animate-spin" />
      <span class="ml-2">
        Loading template... (T: {{ selectedTemplateId }}, C:
        {{ selectedCollectionId }}, hasTemplate: {{ !!template }}, hasAsset:
        {{ !!localAsset }})
      </span>
    </div>
    <div v-else class="p-4 text-center">
      <p>
        Debug: T: {{ selectedTemplateId }}, C: {{ selectedCollectionId }},
        hasTemplate: {{ !!template }}, hasAsset: {{ !!localAsset }}, isLoading:
        {{ isLoading }}
      </p>
    </div>
    <ConfirmModal
      v-if="isConfirmLeaveModalOpen"
      :isOpen="isConfirmLeaveModalOpen"
      title="Unsaved Changes"
      type="warning"
      confirmLabel="Leave"
      cancelLabel="Stay"
      @close="onCancelLeave"
      @confirm="onConfirmLeave">
      <p>You have unsaved changes. Are you sure you want to leave?</p>
    </ConfirmModal>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { computed, nextTick } from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import EditAssetForm from "@/pages/CreateOrEditAssetPage/EditAssetForm/EditAssetForm.vue";
import { RelatedAssetSaveMessage, WidgetContent } from "@/types";
import Button from "@/components/Button/Button.vue";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import {
  onBeforeRouteUpdate,
  useRoute,
  useRouter,
  onBeforeRouteLeave,
} from "vue-router";
import { hasWidgetContent } from "@/helpers/hasWidgetContent";
import { SAVE_RELATED_ASSET_TYPE } from "@/constants/constants";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal.vue";
import { useConfirmation } from "./useConfirmation";
import SpinnerIcon from "@/icons/SpinnerIcon.vue";
import { useAssetEditor } from "./useAssetEditor/useAssetEditor";

const props = withDefaults(
  defineProps<{
    assetId?: string | null;
    title?: string;
  }>(),
  {
    assetId: null,
    title: "Edit Asset",
  }
);

// Use the clean asset editor composable
const {
  localAsset,
  template,
  selectedTemplateId,
  selectedCollectionId,
  isCreateMode,
  isDirty,
  isValid,
  isLoading,
  isTemplateLoading,
  isSaving,
  templateOptions,
  collectionOptions,
  savedAssetTitle,
  localAssetTitle,
  setTemplate,
  setCollection,
  updateLocalAsset,
  save,
  saveAndWait,
  reset,
} = useAssetEditor(() => props.assetId);

// Handler for Continue button
function handleContinue() {
  if (selectedTemplateId.value && selectedCollectionId.value) {
    setTemplate(selectedTemplateId.value);
    setCollection(selectedCollectionId.value);
  }
}

// Auto-initialization is now handled by the composable

const route = useRoute();
const router = useRouter();
const channelName = computed(() => route.query.channelName as string);

async function handleSaveAsset() {
  try {
    await saveAndWait();

    // For create mode, handle redirect after save
    if (isCreateMode.value && localAsset.value?.assetId) {
      const newAssetId = localAsset.value.assetId;

      // Notify parent if this is a related asset
      if (channelName.value) {
        const channel = new BroadcastChannel(channelName.value);
        const message: RelatedAssetSaveMessage = {
          type: SAVE_RELATED_ASSET_TYPE,
          payload: {
            relatedAssetId: newAssetId,
          },
        };
        channel.postMessage(message);
        channel.close();
      }

      // Redirect to edit mode to prevent recreating assets
      router.replace({
        name: "editAsset",
        params: {
          assetId: newAssetId,
        },
      });
    }
  } catch (error) {
    console.error("Save failed:", error);
  }
}

async function handleMigrateCollection(newCollectionId: number) {
  setCollection(newCollectionId);
  await saveAndWait();

  // Redirect after migration to prevent further editing
  nextTick(() => {
    router.push({
      name: "allMyAssets",
    });
  });
}

function handleUpdateTemplateId(newTemplateId: number) {
  setTemplate(newTemplateId);
  save(); // Auto-save after template change
}

const {
  showModal: isConfirmLeaveModalOpen,
  confirm: confirmLeave,
  onConfirm: onConfirmLeave,
  onCancel: onCancelLeave,
} = useConfirmation();

onBeforeRouteLeave(async (to, _from, next) => {
  // if navigating to login/logout page, just proceed
  if (
    typeof to.name === "string" &&
    ["localLogin", "logout"].includes(to.name)
  ) {
    return next();
  }

  // if we still haven't finished initializing, proceed
  if (!template.value || !selectedCollectionId.value || !localAsset.value) {
    return next();
  }

  // if this is a new asset but the form is blank, allow navigation
  if (isCreateMode.value) {
    const widgetsWithContent =
      template.value.widgetArray.filter((widgetDef) => {
        if (!localAsset.value) return false;

        // ignore checkbox widgets so that unchecked boxes are not considered content
        if (widgetDef.type === "checkbox") return false;

        const fieldTitle = widgetDef.fieldTitle;
        const contents = localAsset.value[fieldTitle] as WidgetContent[];
        return hasWidgetContent(contents, widgetDef.type);
      }) ?? [];
    const isFormBlank = widgetsWithContent.length === 0;

    if (isFormBlank) {
      return next();
    }
  }

  // no unsaved changes, proceed with navigation
  if (!isDirty.value) return next();

  // otherwise confirm
  const isConfirmed = await confirmLeave();
  return next(isConfirmed);
});

onBeforeRouteUpdate(async (to, _from, next) => {
  if (to.fullPath !== "/assetManager/addAsset") {
    // if not navigating to create asset, just proceed
    return next();
  }

  // confirm if there are unsaved changes
  if (isDirty.value) {
    const isConfirmed = await confirmLeave();
    if (!isConfirmed) {
      return next(false);
    }
  }

  // reset the asset state
  reset();

  next();
});
</script>
<style scoped></style>
