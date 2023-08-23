<template>
  <div class="upload-widget flex gap-2 flex-wrap mt-2">
    <button
      v-for="(content, key) in contents"
      :key="key"
      :title="content.fileDescription"
      class="thumbnail-related-asset-widget flex flex-col rounded-md border border-transparent p-1 no-underline hover:no-underline hover:bg-blue-50 hover:text-blue-600 w-24 text-neutral-600"
      :class="{
        'opacity-80 hover:opacity-100 hover:border-blue-600': !isFileActive(
          content.fileId
        ),
        'ring ring-offset-1 ring-blue-600 hover:border-transparent opacity-100 bg-blue-50':
          isFileActive(content.fileId),
      }"
      @click="assetStore.activeFileObjectId = content.fileId"
    >
      <ThumbnailImage
        :src="`${config.instance.base.url}/fileManager/tinyImageByFileId/${content.fileId}/true`"
        :alt="content.fileDescription"
        :fileType="content.fileType"
        class="thumbnail-related-asset-widget__image max-w-full"
      />
      <SanitizedHTML
        v-if="content.fileDescription"
        class="whitespace-nowrap text-xs mt-1 truncate overflow-hidden w-full text-center"
        :html="content.fileDescription"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { UploadWidgetProps, UploadWidgetContent } from "@/types";
import config from "@/config";
import { useAssetStore } from "@/stores/assetStore";
import ThumbnailImage from "@/components/ThumbnailImage/ThumbnailImage.vue";
import SanitizedHTML from "@/components/SanitizedHTML/SanitizedHTML.vue";

defineProps<{
  widget: UploadWidgetProps;
  contents: UploadWidgetContent[];
}>();

const assetStore = useAssetStore();

const isFileActive = (fileId: string) =>
  assetStore.activeFileObjectId === fileId;
</script>
