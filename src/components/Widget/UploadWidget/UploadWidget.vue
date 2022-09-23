<!-- todo need to fix all the hover state stuff, decide if that matters-->
<template>
  <div class="upload-widget grid grid-cols-3 gap-1">
    <button
      v-for="(content, key) in contents"
      :key="key"
      class="aspect-square w-full inline-block overflow-hidden rounded"
      :class="{
        ' border-neutral-900 border-2 p-px': isFileActive(content.fileId),
        'opacity-50 hover:opacity-100 transition-opacity': !isFileActive(
          content.fileId
        ),
      }"
      @click="assetStore.activeFileObjectId = content.fileId"
    >
      <img
        :src="`${config.baseUrl}/fileManager/getDerivativeById/${content.fileId}/tiny2x`"
        :alt="content.fileDescription"
        class="w-full h-full object-cover rounded-sm"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { UploadWidgetProps, UploadWidgetContent } from "@/types";
import config from "@/config";
import { useAssetStore } from "@/stores/assetStore";

defineProps<{
  widget: UploadWidgetProps;
  contents: UploadWidgetContent[];
}>();

const assetStore = useAssetStore();

const isFileActive = (fileId: string) =>
  assetStore.activeFileObjectId === fileId;
</script>
