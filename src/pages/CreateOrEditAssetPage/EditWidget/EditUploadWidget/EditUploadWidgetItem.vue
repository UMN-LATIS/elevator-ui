<template>
  <div class="edit-upload-widget-item">
    <div class="grid grid-cols-3 gap-x-4 gap-y-2">
      <div class="w-full aspect-square rounded-md overflow-hidden relative">
        <img
          v-if="item.fileId && previewImageUrl"
          :src="previewImageUrl"
          :alt="`thumbnail for item: ${item.fileDescription ?? ''}`"
          class="w-full h-full app-object-fit" />
        <div
          v-else
          class="w-full h-full flex items-center justify-center bg-surface-container-lowest text-on-surface-variant">
          <FileIcon class="size-8" />
          <span class="sr-only">
            No preview image for {{ item.fileDescription }}
          </span>
        </div>
      </div>

      <div class="col-span-2 flex flex-col gap-1">
        <TextAreaGroup
          :label="isDescriptionVisible ? 'Description / Alt Text' : 'Alt Text'"
          :helpText="descriptionFieldHelp"
          :modelValue="item.fileDescription ?? ''"
          @update:modelValue="handleDescriptionUpdate" />
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
            class="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors">
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
      class="flex items-center justify-center gap-2 text-sm text-on-surface-variant hover:text-on-surface w-full p-2 rounded-md hover:bg-surface-container-lowest transition-colors"
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
import { useAssetEditor } from "../../useAssetEditor/useAssetEditor";
import { hasSavedFileInWidget } from "./hasSavedFileInWidget";
import { useInstanceStore } from "@/stores/instanceStore";
import { computed } from "vue";
import TextAreaGroup from "@/components/TextAreaGroup/TextAreaGroup.vue";

const props = defineProps<{
  item: Type.WithId<Type.UploadWidgetContent>;
  widgetDef: Type.UploadWidgetDef;
  isShowingDetails: boolean;
}>();

const instanceStore = useInstanceStore();

// the instance setting decides whether this text is shown on the asset
// page or serves as alt text only, so the field label matches
const isDescriptionVisible = computed(
  () => instanceStore.instance.showThumbnailDescription
);

const descriptionFieldHelp = computed(() =>
  isDescriptionVisible.value
    ? "Shown below the file's thumbnail and used by screen readers to describe the content of the file."
    : "Used by screen readers to describe the content of the file. Not displayed on the page."
);

const emit = defineEmits<{
  (e: "update:item", item: Type.WithId<Type.UploadWidgetContent>): void;
  (e: "toggle:details"): void;
}>();

// Use the new preview image composable
const { previewImageUrl } = usePreviewImage(() => props.item.fileId);

const assetEditor = useAssetEditor();

const isFileSavedInWidget = computed(() =>
  hasSavedFileInWidget(
    assetEditor.savedAsset,
    props.widgetDef.fieldTitle,
    props.item.fileId
  )
);

const { data: fileMetaData } = useFileMetadataQuery(() => props.item.fileId, {
  // getMetadataForObject 404s until a save links the file to its asset, and
  // savedAsset is where that link shows up.
  enabled: isFileSavedInWidget,
});

function handleDescriptionUpdate(value: string) {
  emit("update:item", {
    ...props.item,
    fileDescription: value,
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
