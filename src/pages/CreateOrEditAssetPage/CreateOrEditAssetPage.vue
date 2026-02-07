<template>
  <DefaultLayout>
    <form
      v-if="!assetId && !assetEditor.isInitialized"
      class="flex flex-col gap-4 w-full max-w-sm mx-auto mt-12 bg-surface rounded-md border border-on-surface p-4"
      @submit.prevent="handleInitNewAsset">
      <SelectGroup
        v-model="state.selectedTemplateId"
        :options="assetEditor.templateOptions"
        label="Template"
        required />
      <SelectGroup
        v-model="state.selectedCollectionId"
        :options="assetEditor.collectionOptions"
        label="Collection"
        required />

      <Button
        type="submit"
        variant="primary"
        class="block my-4 w-full"
        :disabled="!state.selectedCollectionId || !state.selectedTemplateId">
        Continue
        <SpinnerIcon
          v-if="assetEditor.isTemplateLoading"
          class="w-4 h-4 ml-2 animate-spin" />
      </Button>
    </form>
    <div
      v-else-if="!assetEditor.isInitialized"
      class="flex justify-center items-center py-12">
      <SpinnerIcon class="w-8 h-8 animate-spin" />
      <span class="ml-2">Loading...</span>
    </div>
    <Transition v-else name="fade">
      <EditAssetForm
        :selectedTemplateId="state.selectedTemplateId"
        :template="assetEditor.template!"
        :asset="assetEditor.localAsset!"
        :savedAssetTitle="assetEditor.savedAssetTitle"
        :localAssetTitle="assetEditor.localAssetTitle"
        :saveStatus="assetEditor.saveAssetStatus"
        :hasUnsavedChanges="assetEditor.hasAssetChanged"
        class="flex-1"
        @update:templateId="handleConfirmTemplateChange($event)"
        @migrateCollection="handleConfirmCollectionChange($event)"
        @save="handleSaveAsset"
        @update:asset="assetEditor.updateLocalAsset($event)" />
    </Transition>
    <Teleport to="body">
      <ConfirmModal
        type="danger"
        :isOpen="state.isConfirmingTemplateChange"
        title="Are you sure?"
        @confirm="updateTemplateId"
        @close="
          () => {
            state.isConfirmingTemplateChange = false;
            state.destTemplateId = null;
            // Reset selectedTemplateId back to the original value
            state.selectedTemplateId =
              assetEditor.localAsset?.templateId ?? null;
          }
        ">
        <p>
          Switching templates may result in the loss of data. The following
          fields are not present in the new template:
        </p>

        <ul v-if="state.templateComparison" class="list-disc list-inside">
          <li
            v-for="(value, key) in (state.templateComparison as TemplateComparison)"
            :key="key">
            {{ value.label }} ({{ value.type }})
          </li>
        </ul>
      </ConfirmModal>

      <ConfirmModal
        type="danger"
        :isOpen="state.isConfirmingMigrateCollection"
        title="Move Asset to New Collection?"
        @confirm="migrateCollection"
        @close="
          () => {
            state.isConfirmingMigrateCollection = false;
            state.destCollectionId = null;
          }
        ">
        <div class="flex flex-col gap-4">
          <p>
            Changing collections will make this asset
            <b>temporarily unavailable</b>
            while the migration is taking place.
          </p>

          <p>
            Your current changes will be
            <b>saved.</b>
          </p>
        </div>
      </ConfirmModal>
    </Teleport>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { computed, nextTick, onMounted, provide, reactive, watch } from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import EditAssetForm from "@/pages/CreateOrEditAssetPage/EditAssetForm/EditAssetForm.vue";
import { RelatedAssetSaveMessage, TemplateComparison } from "@/types";
import Button from "@/components/Button/Button.vue";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import { onBeforeRouteUpdate, useRoute, useRouter } from "vue-router";
import { SAVE_RELATED_ASSET_TYPE } from "@/constants/constants";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal.vue";
import SpinnerIcon from "@/icons/SpinnerIcon.vue";
import { createAssetEditor } from "./useAssetEditor/useAssetEditor";
import invariant from "tiny-invariant";
import { fetchTemplateComparison } from "@/api/fetchers";
import { isEmpty } from "ramda";
import { ASSET_EDITOR_PROVIDE_KEY } from "@/constants/constants";
import { useToastStore } from "@/stores/toastStore";
import { useAssetValidationProvider } from "./useAssetEditor/useAssetValidation";
import { usePageAssetIdProvider } from "@/composables/usePageAssetId";

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
const assetEditor = createAssetEditor();

useAssetValidationProvider(
  () => assetEditor.localAsset,
  () => assetEditor.template,
  assetEditor.getWidgetInstanceId
);

const toastStore = useToastStore();

watch(
  () => props.assetId,
  () => {
    props.assetId
      ? assetEditor.initExistingAsset(props.assetId)
      : assetEditor.reset();
  },
  { immediate: true }
);

const state = reactive({
  // template/collection selection - used for both new assets and editing
  selectedTemplateId: null as number | null,
  selectedCollectionId: null as number | null,

  // confirm template change
  isConfirmingTemplateChange: false,
  destTemplateId: null as number | null,
  templateComparison: null as TemplateComparison | null,

  // confirm collection migration
  isConfirmingMigrateCollection: false,
  destCollectionId: null as number | null,
});

// Sync selectedTemplateId with the current asset's templateId when editing
watch(
  () => assetEditor.localAsset?.templateId,
  (templateId) => {
    if (templateId) {
      state.selectedTemplateId = templateId;
    }
  },
  { immediate: true }
);

function isTemplateOption(templateId: number) {
  return assetEditor.templateOptions.some((option) => option.id === templateId);
}

onMounted(() => {
  const params = new URLSearchParams(window.location.search);
  const defaultTemplateId = Number(params.get("defaultTemplateId"));
  const collectionId = Number(params.get("collectionId"));

  if (defaultTemplateId && isTemplateOption(defaultTemplateId)) {
    state.selectedTemplateId = defaultTemplateId;
  }

  if (
    collectionId &&
    assetEditor.collectionOptions.some((c) => c.id === collectionId)
  ) {
    state.selectedCollectionId = collectionId;
  }

  // if only 1 template or collection, set it as the default
  if (!state.selectedTemplateId && assetEditor.templateOptions.length === 1) {
    state.selectedTemplateId = assetEditor.templateOptions[0].id;
  }

  if (assetEditor.collectionOptions.length === 1) {
    state.selectedCollectionId = assetEditor.collectionOptions[0].id;
  }
});

function handleInitNewAsset() {
  invariant(
    state.selectedTemplateId && state.selectedCollectionId,
    "Template and collection must be selected to create a new asset"
  );
  assetEditor.initNewAsset({
    templateId: state.selectedTemplateId,
    collectionId: state.selectedCollectionId,
  });
}

const route = useRoute();
const router = useRouter();
const channelName = computed(() => route.query.channelName as string);

async function handleSaveAsset() {
  const isNewAsset = !props.assetId;
  try {
    await assetEditor.saveAsset();

    toastStore.addToast({
      title: "Saved",
      message: `Asset saved successfully.`,
      variant: "success",
      duration: 3000,
    });

    invariant(
      assetEditor.localAsset?.assetId,
      "Local asset id must be defined after saving"
    );
    const savedAssetId = assetEditor.localAsset.assetId;

    // if this is an existing asset, we're done
    if (!isNewAsset) {
      return;
    }

    // if we're creating a related asset, notify the parent
    if (channelName.value) {
      const channel = new BroadcastChannel(channelName.value);
      const message: RelatedAssetSaveMessage = {
        type: SAVE_RELATED_ASSET_TYPE,
        payload: {
          relatedAssetId: savedAssetId,
        },
      };
      channel.postMessage(message);
      channel.close();
    }

    // redirect to the edit asset page (so that we don't keep recreating
    // new assets on each save!)
    await nextTick();
    router.replace({
      name: "editAsset",
      params: {
        assetId: savedAssetId,
      },
      state: {
        preserveScroll: true,
      },
    });
  } catch (error) {
    invariant(error instanceof Error);
    // handle error, e.g. show a toast
    console.error("Error saving asset:", error);
    toastStore.addToast({
      title: "Error",
      message: `Failed to save asset: ${error.message}`,
      variant: "error",
    });
  }
}

async function handleConfirmCollectionChange(newCollectionId: number) {
  invariant(
    newCollectionId,
    "New collection ID must be provided to migrate the asset"
  );
  state.isConfirmingMigrateCollection = true;
  state.selectedCollectionId = newCollectionId;
}

async function migrateCollection() {
  state.isConfirmingMigrateCollection = false;
  invariant(
    state.selectedCollectionId,
    "Selected collection ID must be set to confirm migration"
  );
  await assetEditor.updateCollection(state.selectedCollectionId);
  await assetEditor.saveAsset();
  toastStore.addToast({
    message: "Migration started. This may take a few minutes.",
  });

  // redirect to the all my assets page after saving
  router.push({
    name: "allMyAssets",
  });
}

async function handleConfirmTemplateChange(templateId: number) {
  invariant(
    templateId,
    "Template ID must be provided to update the asset editor"
  );

  if (templateId === assetEditor.templateId) {
    return;
  }

  // Update selected state immediately to show in UI
  state.selectedTemplateId = templateId;
  state.isConfirmingTemplateChange = true;
  state.destTemplateId = templateId;
  const sourceTemplateId = assetEditor.localAsset?.templateId;
  invariant(
    sourceTemplateId,
    "Source template ID must be defined to compare templates"
  );
  const comparison = await fetchTemplateComparison(
    sourceTemplateId,
    templateId
  );

  // handle [] returned from API
  state.templateComparison = isEmpty(comparison)
    ? null
    : (comparison as TemplateComparison);
}

async function updateTemplateId() {
  state.isConfirmingTemplateChange = false;
  invariant(
    state.destTemplateId,
    "Destination template ID must be set to confirm template change"
  );
  await assetEditor.migrateToTemplate(state.destTemplateId);

  // save and replace route
  handleSaveAsset();
}

// provide the asset editor to child components
// each asset editor instance gets its own instance
// so that we can have multiple tabs editing different assets
// without interference. Still, sometimes the child component
// needs to access the parent asset editor instance to do
// things like register an `onBeforeSave` callback
// (e.g. with inline asset editing, we want to save the
// inline asset before the parent saves)
provide(ASSET_EDITOR_PROVIDE_KEY, assetEditor);

usePageAssetIdProvider(() => props.assetId ?? null);

onBeforeRouteUpdate(async (to, _from, next) => {
  if (to.fullPath !== "/assetManager/addAsset") {
    // if not navigating to create asset, just proceed
    return next();
  }

  // reset the asset state
  assetEditor.reset();

  next();
});
</script>
<style scoped>
label {
  color: var(--app-input-label-textColor, oklch(var(--on-surface)));
}
</style>
