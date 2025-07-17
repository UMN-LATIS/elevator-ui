<template>
  <div
    class="grid grid-cols-[1fr,auto] md:grid-cols-[auto,1fr] items-center md:items-start gap-4">
    <div
      class="size-16 md:size-24 bg-black/10 rounded-lg overflow-hidden order-2 md:order-1 flex items-center justify-center">
      <img
        v-if="typeof asset.firstFileHandlerId === 'string'"
        :src="previewImageStore.getPreviewImageUrl(asset.firstFileHandlerId)"
        class="w-full h-full object-cover" />
      <p v-else class="text-xs">No image yet</p>
    </div>
    <div class="order-1 md:order-2">
      <header class="md:mb-4">
        <h1 class="text-xs md:text-base font-bold uppercase text-black/25">
          {{ asset.assetId ? "Edit Asset" : "Create Asset" }}
        </h1>
        <h2 class="text-xl md:text-2xl font-bold">
          {{ asset.title?.[0] || asset.assetId || "New Asset" }}
        </h2>
      </header>
    </div>
  </div>
</template>
<script setup lang="ts">
import * as Types from "@/types";
import { usePreviewImageStore } from "@/stores/previewImageStore";

defineProps<{
  asset: Types.Asset | Types.UnsavedAsset;
  template: Types.Template;
}>();

const previewImageStore = usePreviewImageStore();
</script>
<style scoped></style>
