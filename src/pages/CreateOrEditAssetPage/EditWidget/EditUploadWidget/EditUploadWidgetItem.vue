<template>
  <div class="edit-upload-widget-item">
    <div class="grid grid-cols-3 gap-4 mb-2">
      <div class="w-full aspect-square rounded-md overflow-hidden relative">
        <img
          v-if="item.fileId && previewImageUrl"
          :src="previewImageUrl"
          :alt="`thumbnail for item: ${item.fileDescription}`"
          class="w-full h-full object-cover" />
        <div
          v-else
          class="w-full h-full flex items-center justify-center bg-black/5 text-neutral-400">
          <FileIcon class="size-8" />
          <span class="sr-only">
            No preview image for {{ item.fileDescription }}
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
          :value="item.fileDescription"
          class="bg-black/5 border-none rounded-md w-full text-sm font-mono flex-1 placeholder:text-neutral-400"
          @input="handleDescriptionUpdate" />
      </div>
      <EditUploadWidgetItemSidecars
        class="col-span-3"
        :item="item"
        :widgetDef="widgetDef"
        @update:item="$emit('update:item', $event)" />

      <section
        v-if="isShowingDetails"
        class="col-span-3 p-4 border border-black/15 rounded-md">
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
              @change="handleRegenerateToggle" />
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
import { ChevronDownIcon, FileIcon } from "lucide-vue-next";
import Tuple from "@/components/Tuple/Tuple.vue";
import Button from "@/components/Button/Button.vue";
import { SpinnerIcon } from "@/icons";
import EditUploadWidgetItemSidecars from "./EditUploadWidgetItemSidecars.vue";
import { usePreviewImage } from "@/helpers/usePreviewImage";

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
