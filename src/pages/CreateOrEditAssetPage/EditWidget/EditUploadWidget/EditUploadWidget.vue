<template>
  <EditWidgetLayout
    :widgetContents="widgetContents"
    :widgetDef="widgetDef"
    class="edit-upload-widget"
    :isOpen="isOpen"
    @update:isOpen="$emit('update:isOpen', $event)"
    @setPrimary="
      (id) =>
        $emit(
          'update:widgetContents',
          ops.makeSetPrimaryContentPayload(widgetContents, id)
        )
    "
    @delete="
      (id) => {
        handleDeleteContent(id);
      }
    "
    @update:widgetContents="
      (widgetContents) => {
        $emit('update:widgetContents', widgetContents as Type.WithId<Type.UploadWidgetContent>[]);
      }
    ">
    <template #fieldContents="{ item }">
      <div>
        <div class="grid grid-cols-3 gap-4 mb-2">
          <div class="w-full aspect-square rounded-md overflow-hidden relative">
            <img
              v-if="isPreviewImageReadyMap.get(item.fileId)"
              :src="`${config.instance.base.url}/fileManager/previewImageByFileId/${item.fileId}/true`"
              :alt="`thumbnail for item: ${item.fileDescription}`"
              class="w-full h-full object-cover" />
            <div
              v-else
              class="w-full h-full flex items-center justify-center bg-black/5 text-neutral-400">
              <SpinnerIcon class="size-5 animate-spin" />
              <span class="sr-only">
                Loading preview image for {{ item.fileDescription }}
              </span>
            </div>
          </div>

          <div class="col-span-2 flex flex-col gap-1">
            <label
              :for="`${item.id}-description`"
              class="block text-xs font-medium text-neutral-700 uppercase">
              Description / Alt Text
              <Tooltip
                tip="Used by screen readers to describe the content of the file.">
                <div
                  class="inline-flex size-4 items-center justify-center bg-black/5 text-neutral-800 rounded-full text-xs">
                  ?
                </div>
              </Tooltip>
            </label>
            <textarea
              :id="`${item.id}-description`"
              v-model="item.fileDescription"
              placeholder="Enter a description for this file"
              class="bg-black/5 border-none rounded-md w-full text-sm font-mono flex-1" />
          </div>
          <EditUploadWidgetItemSidecars
            class="col-span-3"
            :item="item"
            :widgetDef="widgetDef"
            @update:item="handleUpdateItem" />

          <section
            v-if="isShowingDetails.has(item.id)"
            :class="{
              'col-span-3 p-4 border border-black/15 rounded-md':
                isShowingDetails.has(item.id),
            }">
            <h2 class="text-sm font-semibold text-neutral-800 mb-2">
              File Details
            </h2>
            <Tuple label="File ID" class="text-sm text-neutral-600 mb-2">
              {{ item.fileId }}
            </Tuple>
            <Tuple label="File Type" class="text-sm text-neutral-600 mb-2">
              {{ item.fileType }}
            </Tuple>

            <Tuple label="Location" class="text-sm text-neutral-600 mb-2">
              <pre>{{ item.loc || "-" }}</pre>
            </Tuple>
            <Tuple label="Search Data" class="text-sm text-neutral-600 mb-2">
              <pre>{{ item.searchData || "-" }}</pre>
            </Tuple>
            <div class="flex flex-col gap-4 mt-2">
              <label
                class="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
                <input
                  type="checkbox"
                  :checked="item.regenerate === 'On'"
                  class="form-checkbox"
                  @change="
                    handleUpdateRegenerate(
                      item.id,
                      ($event.target as HTMLInputElement).checked
                    )
                  " />
                Regenerate Derivatives
              </label>
              <Button
                :href="`${config.instance.base.url}/assetManager/processingLogsForAsset/${item.fileId}`"
                target="_blank"
                class="text-sm !px-3 !py-2">
                View Processing Logs
              </Button>
            </div>
          </section>
        </div>

        <button
          class="flex items-center justify-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 w-full p-2 rounded-md hover:bg-black/5 transition-colors"
          @click="
            isShowingDetails.has(item.id)
              ? isShowingDetails.delete(item.id)
              : isShowingDetails.add(item.id)
          ">
          <ChevronDownIcon
            class="w-4 h-4 transition-transform"
            :class="{ 'rotate-180': isShowingDetails.has(item.id) }" />
          <span class="sr-only">Toggle Details</span>
        </button>
      </div>
    </template>
    <template #footer>
      <FileUploader
        :collectionId="props.collectionId"
        @complete="handleCompleteUpload" />
    </template>
  </EditWidgetLayout>
</template>
<script setup lang="ts">
import {
  nextTick,
  ref,
  reactive,
  computed,
  onMounted,
  onUnmounted,
  watch,
} from "vue";
import * as Type from "@/types";
import EditWidgetLayout from "../EditWidgetLayout.vue";
import * as ops from "../helpers/editWidgetOps";
import FileUploader from "./FileUploader.vue";
import config from "@/config";
import Tooltip from "@/components/Tooltip/Tooltip.vue";
import { ChevronDownIcon } from "lucide-vue-next";
import Tuple from "@/components/Tuple/Tuple.vue";
import { createDefaultWidgetContent } from "@/helpers/createDefaultWidgetContents";
import api from "@/api";
import Button from "@/components/Button/Button.vue";
import { SpinnerIcon } from "@/icons";
import EditUploadWidgetItemSidecars from "./EditUploadWidgetItemSidecars.vue";

const props = defineProps<{
  collectionId: number;
  widgetDef: Type.UploadWidgetDef;
  widgetContents: Type.WithId<Type.UploadWidgetContent>[];
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (
    e: "update:widgetContents",
    widgetContents: Type.WithId<Type.UploadWidgetContent>[]
  );
  (e: "update:isOpen", isOpen: boolean): void;
  (e: "save"): void;
}>();

onMounted(() => {
  // set up polling for preview images
  pollForPreviewImage();
});

const isShowingDetails = ref<Set<string>>(new Set());

function handleCompleteUpload(fileRecord: Type.FileUploadRecord) {
  // Create a new content item for the uploaded file
  const completedUploadItem: Type.WithId<Type.UploadWidgetContent> = {
    ...createDefaultWidgetContent(props.widgetDef),
    fileId: fileRecord.fileObjectId,
    fileDescription: fileRecord.filename,
    fileType: fileRecord.contentType,
    loc: fileRecord.location || "",
    sidecars: {}, // Initialize sidecars as an empty object
    searchData: "", // Initialize searchData as an empty string
  };

  emit("update:widgetContents", [...props.widgetContents, completedUploadItem]);

  // add the new fileId to the map to track its preview image status
  isPreviewImageReadyMap.set(fileRecord.fileObjectId, false);

  nextTick(() => {
    // Try to trigger save event after the widget contents are updated
    emit("save");
  });
}

const isPreviewImageReadyMap = reactive<Map<string, boolean>>(
  new Map<Type.UploadWidgetContent["fileId"], boolean>()
);

const fileIdSet = computed(() => {
  const fileIds = props.widgetContents.map((item) => item.fileId);
  return new Set(fileIds);
});

watch(
  fileIdSet,
  () => {
    // reconcile the map with the current widget fileIds
    fileIdSet.value.forEach((fileId) => {
      // add missing fileIds to the map
      if (!isPreviewImageReadyMap.has(fileId)) {
        isPreviewImageReadyMap.set(fileId, false);
      }

      // if the fileId exists in map but not in widget contents, remove it
      if (!fileIdSet.value.has(fileId)) {
        isPreviewImageReadyMap.delete(fileId);
      }
    });
  },
  { immediate: true }
);

const fileIdsToCheck = computed(() => {
  return fileIdSet.value.size
    ? Array.from(fileIdSet.value).filter(
        (fileId) => isPreviewImageReadyMap.get(fileId) === false
      )
    : [];
});

let timeoutId: ReturnType<typeof setTimeout> | null = null;
async function pollForPreviewImage() {
  if (fileIdsToCheck.value.length) {
    // If a specific fileObjectId is provided, add it to the list of fileIds to check
    const results = await api.checkPreviewImages(fileIdsToCheck.value);

    // for each fileId, update that status in the map
    results.forEach(({ fileId, status }) => {
      if (fileId && status === "true") {
        isPreviewImageReadyMap.set(fileId, true);
      }
    });
  }

  // queue up the next poll
  timeoutId = setTimeout(pollForPreviewImage, 4000);
}

onUnmounted(() => {
  if (!timeoutId) return;
  clearTimeout(timeoutId);
  timeoutId = null;
});

async function handleDeleteContent(id: string) {
  if (
    !confirm(
      "Delete this upload object? This action cannot be undone and will delete the source media and any derivatives."
    )
  ) {
    return;
  }

  const item = props.widgetContents.find((item) => item.id === id);

  if (!item) {
    throw new Error(
      `No upload item found with id: ${id}. Cannot delete non-existent item.`
    );
  }

  // Call the API to delete the file object
  await api.deleteFileObject(item.fileId);

  emit(
    "update:widgetContents",
    ops.deleteWidgetContent(props.widgetContents, id)
  );

  nextTick(() => {
    // Try to trigger save event after the widget contents are updated
    emit("save");
  });
}

function handleUpdateRegenerate(itemId: string, isChecked: boolean) {
  const updatedContents = props.widgetContents.map((item) => {
    if (item.id === itemId) {
      return {
        ...item,
        regenerate: isChecked ? "On" : undefined, // Set to "On" or undefined based on checkbox state
      } as Type.WithId<Type.UploadWidgetContent>;
    }
    return item;
  });
  // Emit the updated widget contents
  emit("update:widgetContents", updatedContents);
}

function handleUpdateItem(item: Type.WithId<Type.UploadWidgetContent>) {
  const updatedContents = props.widgetContents.map((existingItem) => {
    if (existingItem.id === item.id) {
      return { ...existingItem, ...item };
    }
    return existingItem;
  });
  emit("update:widgetContents", updatedContents);
}
</script>
<style scoped></style>
<style></style>
