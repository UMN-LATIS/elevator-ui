<template>
  <div class="edit-upload-widget-item">
    <div class="grid grid-cols-3 gap-x-4 gap-y-2">
      <div class="w-full aspect-square rounded-md overflow-hidden relative">
        <img
          v-if="item.fileId && previewImageUrl"
          :src="previewImageUrl"
          :alt="`thumbnail for item: ${item.fileDescription}`"
          class="w-full h-full app-object-fit" />
        <div
          v-else
          class="w-full h-full flex items-center justify-center bg-surface-container-lowest text-neutral-400">
          <FileIcon class="size-8" />
          <span class="sr-only">
            No preview image for {{ item.fileDescription }}
          </span>
        </div>
      </div>

      <div class="col-span-2 flex flex-col gap-1">
        <label
          :for="`${item.id}-description`"
          class="block text-xs font-medium uppercase">
          Description / Alt Text
          <Tooltip
            tip="Used by screen readers to describe the content of the file.">
            <div
              class="inline-flex size-4 items-center justify-center bg-surface-container-lowest text-neutral-800 rounded-full text-xs">
              ?
            </div>
          </Tooltip>
        </label>
        <textarea
          :id="`${item.id}-description`"
          :value="item.fileDescription"
          class="bg-surface-container-lowest border-none rounded-md w-full text-sm font-mono flex-1 placeholder:text-neutral-400"
          @input="handleDescriptionUpdate" />
      </div>
      <div class="col-span-3">
        <Tuple
          label="Source File"
          class="flex items-center justify-between flex-wrap text-sm gap-2 -mt-2">
          {{ fileMetaData?.sourcefile }}
          <Button
            v-if="fileMetaData?.sourcefile"
            :href="`${config.instance.base.url}/fileManager/getOriginal/${item.fileId}`"
            variant="tertiary"
            class="flex items-center gap-1 !no-underline text-xs uppercase font-medium"
            download>
            <DownloadIcon class="!size-4" />
            Download
          </Button>
        </Tuple>
      </div>
      <EditUploadWidgetItemSidecars
        class="col-span-3"
        :item="item"
        :widgetDef="widgetDef"
        :fileMetaData="fileMetaData"
        @update:item="$emit('update:item', $event)" />

      <section
        v-if="isShowingDetails"
        class="col-span-3 py-3 border-y border-outline-variant text-sm flex flex-col gap-2">
        <h2 class="sr-only">File Details</h2>
        <Tuple label="File ID">
          {{ item.fileId }}
        </Tuple>
        <Tuple label="File Type">
          {{ item.fileType }}
        </Tuple>

        <Tuple label="Location">
          <pre>{{ item.loc || "-" }}</pre>
        </Tuple>
        <Tuple label="Search Data">
          <pre>{{ item.searchData || "-" }}</pre>
        </Tuple>
        <div class="flex justify-between gap-4 flex-wrap">
          <label
            class="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
            <input
              type="checkbox"
              :checked="item.regenerate === 'On'"
              class="form-checkbox"
              @change="handleRegenerateToggle" />
            Regenerate Derivatives
          </label>
          <Button
            :href="`${config.instance.base.url}/assetManager/processingLogsForAsset/${item.fileId}`"
            variant="tertiary"
            target="_blank"
            class="text-sm !px-3 !py-2">
            <FileCogIcon class="!size-4" />
            View Logs
          </Button>
        </div>
      </section>
    </div>

    <button
      class="flex items-center justify-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 w-full p-2 rounded-md hover:bg-surface-container-lowest transition-colors"
      @click="$emit('toggle:details')">
      <ChevronDownIcon
        class="w-4 h-4 transition-transform"
        :class="{ 'rotate-180': isShowingDetails }" />
      <span class="sr-only">Toggle Details</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import * as Type from "@/types";
import config from "@/config";
import Tooltip from "@/components/Tooltip/Tooltip.vue";
import {
  ChevronDownIcon,
  FileCogIcon,
  FileIcon,
  DownloadIcon,
} from "lucide-vue-next";
import Tuple from "@/components/Tuple/Tuple.vue";
import Button from "@/components/Button/Button.vue";
import EditUploadWidgetItemSidecars from "./EditUploadWidgetItemSidecars.vue";
import { usePreviewImage } from "@/helpers/usePreviewImage";
import { useFileMetadataQuery } from "@/queries/useFileMetadataQuery";

const props = defineProps<{
  item: Type.WithId<Type.UploadWidgetContent>;
  widgetDef: Type.UploadWidgetDef;
  isShowingDetails: boolean;
}>();

const emit = defineEmits<{
  (e: "update:item", item: Type.WithId<Type.UploadWidgetContent>): void;
  (e: "toggle:details"): void;
}>();

// Use the new preview image composable
const { previewImageUrl } = usePreviewImage(() => props.item.fileId);

const { data: fileMetaData } = useFileMetadataQuery(() => props.item.fileId);

function handleDescriptionUpdate(event: Event) {
  const target = event.target as HTMLTextAreaElement;
  emit("update:item", {
    ...props.item,
    fileDescription: target.value,
  });
}

function handleRegenerateToggle(event: Event) {
  const target = event.target as HTMLInputElement;
  emit("update:item", {
    ...props.item,
    regenerate: target.checked ? "On" : undefined,
  });
}
</script>
