<template>
  <EditWidgetLayout
    :widgetContents="widgetContents"
    :widgetDef="widgetDef"
    class="edit-upload-widget !pt-1"
    :isOpen="isOpen"
    @update:isOpen="$emit('update:isOpen', $event)"
    @setPrimary="
      (uuid) =>
        $emit(
          'update:widgetContents',
          ops.makeSetPrimaryContentPayload(widgetContents, uuid)
        )
    "
    @delete="
      (uuid) => {
        handleDeleteContent(uuid);
      }
    "
    @update:widgetContents="
      (widgetContents) => {
        $emit('update:widgetContents', widgetContents as Type.WithUuid<Type.UploadWidgetContent>[]);
      }
    ">
    <template #moreWidgetActions>
      <DropDown :showChevron="false">
        <template #label>
          <span class="sr-only">Toggle More Actions Menu</span>
          <VerticalDotsIcon class="size-5" />
        </template>
        <DropDownItem is="div">
          <button
            class="w-full flex items-center gap-2"
            @click="handleRegenerateAllDerivatives">
            <CircleFilledCheckIcon
              v-if="isRegeneratingAllDerivatives"
              class="size-4" />
            <Circle v-else class="size-4" />
            Regenerate All Derivatives
          </button>
        </DropDownItem>
      </DropDown>
    </template>
    <template #fieldContents="{ item }">
      <EditUploadWidgetItem
        :item="item"
        :widgetDef="widgetDef"
        :isShowingDetails="isShowingDetails.has(item.uuid)"
        class="upload-widget-item"
        @update:item="handleUpdateItem"
        @toggle:details="toggleDetails(item.uuid)" />
    </template>
    <template #footer>
      <FileUploader
        v-show="widgetDef.allowMultiple || !hasContents"
        :collectionId="props.collectionId"
        :maxNumberOfFiles="widgetDef.allowMultiple ? undefined : 1"
        @complete="handleCompleteUpload" />
    </template>
  </EditWidgetLayout>
</template>
<script setup lang="ts">
import { computed, ref, defineAsyncComponent } from "vue";
import * as Type from "@/types";
import EditWidgetLayout from "../EditWidgetLayout.vue";
import * as ops from "../helpers/editWidgetOps";
import { createDefaultWidgetContent } from "@/helpers/createDefaultWidgetContents";
import api from "@/api";
import { useAssetEditor } from "../../useAssetEditor/useAssetEditor";
import { useToastStore } from "@/stores/toastStore";
import { getErrorMessage } from "@/api/getErrorMessage";
import EditUploadWidgetItem from "./EditUploadWidgetItem.vue";
import DropDown from "@/components/DropDown/DropDown.vue";
import DropDownItem from "@/components/DropDown/DropDownItem.vue";
import { VerticalDotsIcon } from "@/icons";
import { Circle } from "lucide-vue-next";
import CircleFilledCheckIcon from "@/icons/CircleFilledCheckIcon.vue";

// Lazy — Uppy + plugins (~300 KB) only load when a curator is actually
// editing an upload widget, not for metadata-only edits.
const FileUploader = defineAsyncComponent(() => import("./FileUploader.vue"));

const props = defineProps<{
  collectionId: number;
  widgetDef: Type.UploadWidgetDef;
  widgetContents: Type.WithUuid<Type.UploadWidgetContent>[];
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (
    e: "update:widgetContents",
    widgetContents: Type.WithUuid<Type.UploadWidgetContent>[]
  );
  (e: "update:isOpen", isOpen: boolean): void;
}>();

const isShowingDetails = ref<Set<string>>(new Set());

function toggleDetails(uuid: string): void {
  if (isShowingDetails.value.has(uuid)) {
    isShowingDetails.value.delete(uuid);
    return;
  }
  isShowingDetails.value.add(uuid);
}
const hasContents = computed(() => {
  return props.widgetContents.length > 0;
});

const assetEditor = useAssetEditor();
const toastStore = useToastStore();

/**
 * Props update one render behind, so two uploads finishing together would
 * both read the old array and the second would drop the first.
 */
function contentsInState(): Type.WithUuid<Type.UploadWidgetContent>[] {
  return (assetEditor.localAsset?.[props.widgetDef.fieldTitle] ??
    []) as Type.WithUuid<Type.UploadWidgetContent>[];
}

function handleCompleteUpload(fileRecord: Type.FileUploadRecord) {
  const uploadedItem: Type.WithUuid<Type.UploadWidgetContent> = {
    ...createDefaultWidgetContent(props.widgetDef),
    fileId: fileRecord.fileObjectId,
    fileDescription: "",
    fileType: fileRecord.contentType,
    loc: null, // server will extract from metadata
    sidecars: {}, // Initialize sidecars as an empty object
    searchData: "", // Initialize searchData as an empty string
  };

  assetEditor.recordCompletedUpload(props.widgetDef.fieldTitle, [
    ...contentsInState(),
    uploadedItem,
  ]);
}

async function handleDeleteContent(uuid: string) {
  if (
    !confirm(
      "Delete this upload object? This action cannot be undone and will delete the source media and any derivatives."
    )
  ) {
    return;
  }

  const item = contentsInState().find((item) => item.uuid === uuid);

  if (!item) {
    throw new Error(
      `No upload item found with uuid: ${uuid}. Cannot delete non-existent item.`
    );
  }

  // save the removal before deleting the file, so a failed save never
  // leaves the asset pointing at destroyed media
  assetEditor.updateWidgetContents(
    props.widgetDef.fieldTitle,
    ops.deleteWidgetContent(contentsInState(), uuid)
  );
  try {
    await assetEditor.saveAsset();
  } catch (cause) {
    toastStore.addToast({
      title: "Error",
      message: `The file was not deleted because the asset could not be saved: ${getErrorMessage(
        cause
      )}`,
      variant: "error",
    });
    return;
  }

  try {
    await api.deleteFileObject(item.fileId);
  } catch (cause) {
    console.error("Error deleting file object:", cause);
    toastStore.addToast({
      title: "Error",
      message:
        "The file was removed from the asset but could not be deleted from storage.",
      variant: "error",
    });
  }
}

function handleUpdateItem(item: Type.WithUuid<Type.UploadWidgetContent>) {
  const updatedContents = contentsInState().map((existingItem) => {
    if (existingItem.uuid === item.uuid) {
      return { ...existingItem, ...item };
    }
    return existingItem;
  });
  emit("update:widgetContents", updatedContents);
}

const isRegeneratingAllDerivatives = computed(() => {
  return props.widgetContents.every(
    (item: Type.WithUuid<Type.UploadWidgetContent>) => item.regenerate === "On"
  );
});

function handleRegenerateAllDerivatives() {
  const items = contentsInState();
  const isEveryItemRegenerating = items.every(
    (item) => item.regenerate === "On"
  );
  const updatedContents = items.map((item) => ({
    ...item,
    // regenerate is not true/false, but "On" or undefined
    regenerate: isEveryItemRegenerating ? undefined : ("On" as const),
  }));

  emit("update:widgetContents", updatedContents);

  // also open all details views
  const allUuids = items.map((item) => item.uuid);
  isShowingDetails.value = new Set(allUuids);
}
</script>
<style scoped></style>
<style>
.edit-upload-widget .dropdown__menu-button {
  padding: 0.25rem;
}

/* hacky fix to slide the tooltip up a bit. The size of the more actions button in the row above pushes it down otherwise, and makes it look like there's too much space between the widget label and the tooltip */
.edit-upload-widget .widget-tooltip {
  position: relative;
  top: -0.5rem;
}
</style>
