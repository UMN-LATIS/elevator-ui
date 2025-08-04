<template>
  <DefaultLayout>
    <form
      v-if="!assetId && !localAsset"
      class="flex flex-col gap-4 w-full max-w-sm mx-auto mt-12 bg-white rounded-md border border-neutral-900 p-4"
      @submit.prevent="initNewAsset">
      <SelectGroup
        v-model="selectedTemplateId"
        :options="templateOptions"
        label="Template"
        required />
      <SelectGroup
        v-model="selectedCollectionId"
        :options="collectionOptions"
        label="Collection"
        required />

      <Button
        type="submit"
        variant="primary"
        class="block my-4 w-full"
        :disabled="!selectedTemplateId || !selectedCollectionId || !template">
        Continue
        <SpinnerIcon v-if="isTemplateLoading" />
      </Button>
    </form>
    <div
      v-else-if="assetId && (isTemplateLoading || !hasInitialized)"
      class="flex justify-center items-center py-12">
      <SpinnerIcon class="w-8 h-8 animate-spin" />
      <span class="ml-2">Loading...</span>
    </div>
    <Transition v-else-if="localAsset && template" name="fade">
      <EditAssetForm
        :template="template"
        :asset="localAsset"
        :savedAssetTitle="savedAssetTitle"
        :localAssetTitle="localAssetTitle"
        :saveStatus="saveAssetStatus"
        :hasUnsavedChanges="hasAssetChanged"
        :isValid="isFormValid"
        class="flex-1"
        @update:templateId="updateTemplateId($event)"
        @migrateCollection="handleMigrateCollectionWithNavigation($event)"
        @save="handleSaveAsset"
        @update:asset="updateLocalAsset($event)" />
    </Transition>
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
import { computed, onMounted } from "vue";
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
import invariant from "tiny-invariant";

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

// Use the asset editor composable
const assetEditor = useAssetEditor(() => props.assetId);

const {
  hasInitialized,
  localAsset,
  template,
  selectedTemplateId,
  selectedCollectionId,
  isCreateMode,
  hasAssetChanged,
  isFormValid,
  isTemplateLoading,
  saveAssetStatus,
  templateOptions,
  collectionOptions,
  savedAssetTitle,
  localAssetTitle,
  initNewAsset,
  saveAsset,
  updateTemplateId,
  migrateCollection,
  resetEditor,
  updateLocalAsset,
} = assetEditor;

onMounted(() => {
  // if only 1 template or collection, set it as the default
  if (templateOptions.value.length === 1) {
    selectedTemplateId.value = templateOptions.value[0].id;
  }
  if (collectionOptions.value.length === 1) {
    selectedCollectionId.value = collectionOptions.value[0].id;
  }
});

const route = useRoute();
const router = useRouter();
const channelName = computed(() => route.query.channelName as string);

async function handleSaveAsset() {
  const data = await saveAsset();
  invariant(data, "Expected data to be defined after saveAsset");

  if (!isCreateMode.value) {
    return;
  }

  const newAssetId = data.objectId;

  // if we're creating a related asset, notify the parent
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

  // redirect to the edit asset page (so that we don't keep recreating
  // new assets on each save!)
  router.replace({
    name: "editAsset",
    params: {
      assetId: newAssetId,
    },
  });
}

async function handleMigrateCollectionWithNavigation(newCollectionId: number) {
  await migrateCollection(newCollectionId);

  // migrating the collection can take a bit of time, so redirect
  // the user to the all my assets page after saving to prevent
  // more editing during the migration
  router.push({
    name: "allMyAssets",
  });
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
  if (!hasAssetChanged.value) return next();

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
  if (hasAssetChanged.value) {
    const isConfirmed = await confirmLeave();
    if (!isConfirmed) {
      return next(false);
    }
  }

  // reset the asset state
  resetEditor();

  next();
});
</script>
<style scoped></style>
