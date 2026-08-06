<template>
  <DefaultLayout>
    <form
      v-if="!assetId && !assetEditor.isEditingAsset"
      class="flex flex-col gap-4 w-full max-w-sm mx-auto mt-12 rounded-md p-4 border border-outline-variant"
      @submit.prevent="handleInitNewAsset">
      <SelectGroup
        v-model="state.selectedTemplateId"
        :options="templateOptions"
        label="Template"
        required />
      <SelectGroup
        v-model="state.selectedCollectionId"
        :options="collectionOptions"
        label="Collection"
        required />

      <Button
        type="submit"
        variant="primary"
        class="flex my-4 justify-center items-center"
        :disabled="!state.selectedCollectionId || !state.selectedTemplateId">
        Continue
        <SpinnerIcon
          v-if="assetEditor.status === 'loadingTemplate'"
          class="w-4 h-4 ml-2 animate-spin" />
      </Button>
    </form>
    <DeletedAssetNotice
      v-else-if="deletedAssetInfo"
      :assetId="assetId!"
      :deletedAt="deletedAssetInfo.deletedAt"
      @restored="handleRestored" />
    <div
      v-else-if="assetEditor.loadError"
      class="flex flex-col items-center gap-2 py-12 text-error">
      <TriangleAlert class="w-8 h-8" />
      <p>This asset could not be loaded.</p>
      <p class="text-sm text-on-surface-variant">
        {{ assetEditor.loadError.message }}
      </p>
    </div>
    <div
      v-else-if="!assetEditor.isEditingAsset"
      class="flex justify-center items-center py-12">
      <SpinnerIcon class="w-8 h-8 animate-spin" />
      <span class="ml-2">Loading...</span>
    </div>
    <Transition v-else name="fade">
      <EditAssetForm
        :selectedTemplateId="state.selectedTemplateId"
        :selectedCollectionId="state.selectedCollectionId"
        :template="assetEditor.template!"
        :asset="assetEditor.localAsset!"
        :savedAssetTitle="savedAssetTitle"
        :localAssetTitle="localAssetTitle"
        :saveStatus="assetEditor.saveAssetIndicator"
        :hasUnsavedChanges="assetEditor.hasUnsavedChanges"
        class="flex-1"
        @update:templateId="handleConfirmTemplateChange($event)"
        @migrateCollection="handleConfirmCollectionChange($event)"
        @save="handleSaveAsset({ shouldConfirmSave: true })"
        @autoSave="handleSaveAsset({ shouldConfirmSave: false })"
        @update:widgetContents="
          assetEditor.updateWidgetContents($event.fieldTitle, $event.contents)
        "
        @update:readyForDisplay="assetEditor.updateReadyForDisplay($event)"
        @update:availableAfter="assetEditor.updateAvailableAfter($event)" />
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
            // the user declined, so clear the selection and let the
            // sidebar fall back to the asset's current collection
            state.selectedCollectionId = null;
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
      <ConfirmModal
        type="warning"
        :isOpen="!!leaveBlocker"
        :title="leaveBlocker ? leaveConfirmCopy[leaveBlocker].title : ''"
        confirmLabel="Leave"
        cancelLabel="Stay"
        @confirm="handleLeaveConfirm"
        @close="handleLeaveCancel">
        {{ leaveBlocker ? leaveConfirmCopy[leaveBlocker].body : "" }}
      </ConfirmModal>
    </Teleport>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch, watchEffect } from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import EditAssetForm from "@/pages/CreateOrEditAssetPage/EditAssetForm/EditAssetForm.vue";
import { RelatedAssetSaveMessage, TemplateComparison } from "@/types";
import Button from "@/components/Button/Button.vue";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import {
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
  useRoute,
  useRouter,
  type RouteLocationNormalized,
} from "vue-router";
import { SAVE_RELATED_ASSET_TYPE } from "@/constants/constants";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal.vue";
import SpinnerIcon from "@/icons/SpinnerIcon.vue";
import { TriangleAlert } from "lucide-vue-next";
import { provideAssetEditor } from "./useAssetEditor/provideAssetEditor";
import DeletedAssetNotice from "@/pages/AssetViewPage/DeletedAssetNotice.vue";
import { ApiError } from "@/api/ApiError";
import { getErrorMessage } from "@/api/getErrorMessage";
import type { DeletedAssetInfo } from "@/types";
import invariant from "tiny-invariant";
import { fetchTemplateComparison } from "@/api/fetchers";
import { isEmpty } from "ramda";
import { useToastStore } from "@/stores/toastStore";
import { useUploadStore } from "@/stores/uploadStore";
import { useInstanceStore } from "@/stores/instanceStore";
import { usePageAssetIdProvider } from "@/composables/usePageAssetId";
import {
  toCollectionOptions,
  toTemplateOptions,
} from "./instanceSelectOptions";
import { getAssetDisplayTitle } from "./useAssetEditor/localAsset";

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

// each page gets its own editor, so two tabs editing different assets never
// touch each other's state. Descendants reach it, and the validation derived
// from it, through the provides this sets up.
const assetEditor = provideAssetEditor({
  onAssetCreated: handleAssetCreated,
});

const toastStore = useToastStore();
const uploadStore = useUploadStore();
const instanceStore = useInstanceStore();
const deletedAssetInfo = ref<DeletedAssetInfo | null>(null);

const templateOptions = computed(() =>
  toTemplateOptions(instanceStore.instance.templates ?? [])
);
const collectionOptions = computed(() =>
  toCollectionOptions(instanceStore.flatCollections ?? [])
);

const localAssetTitle = computed(() =>
  assetEditor.localAsset ? getAssetDisplayTitle(assetEditor.localAsset) : ""
);
const savedAssetTitle = computed(
  () =>
    assetEditor.savedAsset?.title?.[0] ?? assetEditor.savedAsset?.assetId ?? ""
);

function handleRestored() {
  deletedAssetInfo.value = null;
  if (props.assetId) {
    assetEditor.initExistingAsset(props.assetId, { force: true });
  }
}

/** What the user would lose by leaving, or null when nothing is at stake. */
type LeaveBlocker = "activeUpload" | "unsavedEdits";
const leaveBlocker = ref<LeaveBlocker | null>(null);

const leaveConfirmCopy: Record<LeaveBlocker, { title: string; body: string }> =
  {
    activeUpload: {
      title: "Upload in progress",
      body: "Navigating away will cancel your upload. Are you sure you want to leave?",
    },
    unsavedEdits: {
      title: "Unsaved changes",
      body: "Your unsaved changes will be lost if you leave. Are you sure?",
    },
  };

// Holds the resolve function for the pending navigation guard promise.
let resolveLeaveGuard: ((allow: boolean) => void) | null = null;

// Trigger the browser's native "Leave site?" dialog when the user tries to
// close the tab, reload, or navigate to an external URL while an upload is
// running or edits are unsaved.
watchEffect((onCleanup) => {
  if (!uploadStore.hasActiveUploads && !assetEditor.hasUnsavedChanges) return;
  const handler = (e: BeforeUnloadEvent) => {
    e.preventDefault();
  };
  window.addEventListener("beforeunload", handler);

  // onCleanup (not onUnmounted) is used because the listener must be removed
  // as soon as uploads finish — not just when the component is destroyed.
  // watchEffect calls the cleanup before each re-run and on unmount, covering both cases.
  onCleanup(() => window.removeEventListener("beforeunload", handler));
});

/**
 * Show our custom ConfirmModal before in-app (Vue Router) navigation that
 * would cancel an upload or drop unsaved edits.
 */
async function confirmLeavingWorkBehind(
  to: RouteLocationNormalized
): Promise<boolean> {
  // the redirect onto the asset this editor just created reuses the
  // component and carries every pending edit and upload with it, so
  // nothing is being left behind
  const isTargetTheAssetBeingEdited =
    to.name === "editAsset" &&
    to.params.assetId === assetEditor.localAsset?.assetId;
  if (isTargetTheAssetBeingEdited) return true;

  if (uploadStore.hasActiveUploads) {
    return askBeforeLeaving("activeUpload");
  }

  if (assetEditor.hasUnsavedChanges) {
    return askBeforeLeaving("unsavedEdits");
  }
  return true;
}

function askBeforeLeaving(blocker: LeaveBlocker): Promise<boolean> {
  leaveBlocker.value = blocker;
  return new Promise<boolean>((resolve) => {
    resolveLeaveGuard = resolve;
  });
}

onBeforeRouteLeave(confirmLeavingWorkBehind);

function settleLeaveGuard(canLeave: boolean) {
  leaveBlocker.value = null;
  resolveLeaveGuard?.(canLeave);
  resolveLeaveGuard = null;
}

function handleLeaveConfirm() {
  settleLeaveGuard(true);
}

function handleLeaveCancel() {
  settleLeaveGuard(false);
}

watch(
  () => props.assetId,
  async () => {
    deletedAssetInfo.value = null;
    if (!props.assetId) {
      assetEditor.reset();
      return;
    }
    try {
      await assetEditor.initExistingAsset(props.assetId);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 410) {
        deletedAssetInfo.value = err.data as DeletedAssetInfo;
      } else {
        throw err;
      }
    }
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
  return templateOptions.value.some((option) => option.id === templateId);
}

const route = useRoute();
const router = useRouter();

onMounted(() => {
  const defaultTemplateId = Number(route.query.defaultTemplateId);
  const collectionId = Number(route.query.collectionId);

  if (defaultTemplateId && isTemplateOption(defaultTemplateId)) {
    state.selectedTemplateId = defaultTemplateId;
  }

  if (
    collectionId &&
    collectionOptions.value.some((c) => c.id === collectionId)
  ) {
    state.selectedCollectionId = collectionId;
  }

  // if only 1 template or collection, set it as the default
  if (!state.selectedTemplateId && templateOptions.value.length === 1) {
    state.selectedTemplateId = templateOptions.value[0].id;
  }

  if (!state.selectedCollectionId && collectionOptions.value.length === 1) {
    state.selectedCollectionId = collectionOptions.value[0].id;
  }
});

async function handleInitNewAsset() {
  invariant(
    state.selectedTemplateId && state.selectedCollectionId,
    "Template and collection must be selected to create a new asset"
  );
  try {
    await assetEditor.initNewAsset({
      templateId: state.selectedTemplateId,
      collectionId: state.selectedCollectionId,
    });
  } catch (error) {
    invariant(error instanceof Error);
    console.error("Error starting new asset:", error);
    toastStore.addToast({
      title: "Error",
      message: `Could not load the template: ${error.message}`,
      variant: "error",
    });
  }
}

const channelName = computed(() => route.query.channelName as string);

/** Runs when the reducer confirms the server created the draft. */
function handleAssetCreated(assetId: string) {
  // if we're creating a related asset, notify the parent
  if (channelName.value) {
    const channel = new BroadcastChannel(channelName.value);
    const message: RelatedAssetSaveMessage = {
      type: SAVE_RELATED_ASSET_TYPE,
      payload: {
        relatedAssetId: assetId,
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
      assetId,
    },
    state: {
      preserveScroll: true,
    },
  });
}

/**
 * @param shouldConfirmSave - whether a successful save says so. An auto-save
 * the user did not ask for stays quiet when it works, but never when it
 * fails.
 */
async function handleSaveAsset({
  shouldConfirmSave,
}: {
  shouldConfirmSave: boolean;
}) {
  const isNewAsset = !props.assetId;
  try {
    await assetEditor.saveAsset();

    // if this is an existing asset, we're done
    if (!isNewAsset) {
      return;
    }

    const savedAssetId = assetEditor.localAsset?.assetId ?? null;
    if (!savedAssetId) {
      // the editor took in a different asset while this save was in flight,
      // so the reducer dropped its result. The save itself succeeded, but
      // the toast belongs to a page the user has already left.
      return;
    }

    if (shouldConfirmSave) {
      toastStore.addToast({
        title: "Saved",
        message: `Asset saved successfully.`,
        variant: "success",
        duration: 3000,
      });
    }
  } catch (error) {
    invariant(error instanceof Error);
    console.error("Error saving asset:", error);

    toastStore.addToast({
      title: "Error",
      message: `Failed to save asset: ${getErrorMessage(error)}`,
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
  const collectionIdBeforeMigration = assetEditor.localAsset?.collectionId;
  assetEditor.updateCollection(state.selectedCollectionId);

  try {
    await assetEditor.saveAsset();
  } catch (error) {
    invariant(error instanceof Error);
    console.error("Error migrating collection:", error);
    toastStore.addToast({
      title: "Error",
      message: `Failed to move asset: ${error.message}`,
      variant: "error",
    });
    // undo the collection edit, or the failed migration would sit as an
    // unsaved change and quietly go through on the next save
    if (collectionIdBeforeMigration) {
      assetEditor.updateCollection(collectionIdBeforeMigration);
    }
    state.selectedCollectionId = null;
    return;
  }

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
  try {
    const comparison = await fetchTemplateComparison(
      sourceTemplateId,
      templateId
    );
    // handle [] returned from API
    state.templateComparison = isEmpty(comparison)
      ? null
      : (comparison as TemplateComparison);
  } catch (error) {
    // the modal still warns about data loss in general, just without the
    // list of affected fields
    console.error("Error comparing templates:", error);
    state.templateComparison = null;
  }
}

async function updateTemplateId() {
  state.isConfirmingTemplateChange = false;
  invariant(
    state.destTemplateId,
    "Destination template ID must be set to confirm template change"
  );
  try {
    await assetEditor.migrateToTemplate(state.destTemplateId);
  } catch (error) {
    invariant(error instanceof Error);
    console.error("Error changing template:", error);
    toastStore.addToast({
      title: "Error",
      message: `Failed to change template: ${error.message}`,
      variant: "error",
    });
    // the editor kept the old template, so the asset is unchanged and there
    // is nothing to save
    state.selectedTemplateId = assetEditor.localAsset?.templateId ?? null;
    return;
  }

  // save and replace route
  handleSaveAsset({ shouldConfirmSave: true });
}

usePageAssetIdProvider(() => props.assetId ?? null);

// moving between assets reuses this component, so route updates need the
// same protection as route leaves
onBeforeRouteUpdate(async (to) => {
  const canProceed = await confirmLeavingWorkBehind(to);
  if (!canProceed) return false;

  if (to.fullPath === "/assetManager/addAsset") {
    assetEditor.reset();
  }
  return true;
});
</script>
<style scoped>
label {
  color: var(--on-surface);
}
</style>
