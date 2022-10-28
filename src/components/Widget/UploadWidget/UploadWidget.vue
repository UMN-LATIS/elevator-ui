<!-- todo need to fix all the hover state stuff, decide if that matters-->
<template>
  <div class="upload-widget flex gap-2 flex-wrap">
    <button
      v-for="(content, key) in contents"
      :key="key"
      @click="assetStore.activeFileObjectId = content.fileId"
    >
      <ThumbnailImage
        :src="`${config.baseUrl}/fileManager/tinyImageByFileId/${content.fileId}/true`"
        :alt="content.fileDescription"
        :isActive="isFileActive(content.fileId)"
        iconOnHover="arrow_forward"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { UploadWidgetProps, UploadWidgetContent } from "@/types";
import config from "@/config";
import { useAssetStore } from "@/stores/assetStore";
import ThumbnailImage from "@/components/ThumbnailImage/ThumbnailImage.vue";

defineProps<{
  widget: UploadWidgetProps;
  contents: UploadWidgetContent[];
}>();

const assetStore = useAssetStore();

const isFileActive = (fileId: string) =>
  assetStore.activeFileObjectId === fileId;
</script>
