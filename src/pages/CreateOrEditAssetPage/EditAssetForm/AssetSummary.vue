<template>
  <div
    class="grid grid-cols-[1fr,auto] md:grid-cols-[auto,1fr] items-center md:items-start gap-4">
    <div
      class="size-16 md:size-24 bg-black/10 rounded-lg overflow-hidden order-2 md:order-1 flex items-center justify-center">
      <img
        v-if="previewImgSrc"
        :src="previewImgSrc"
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
import { getThumbURL } from "@/helpers/displayUtils";
import * as Types from "@/types";
import { computed } from "vue";

const props = defineProps<{
  asset: Types.Asset | Types.UnsavedAsset;
  template: Types.Template;
}>();

const previewImgSrc = computed(() => {
  const fileHandlerId = props.asset.firstFileHandlerId as
    | string
    | undefined
    | null;
  return fileHandlerId ? getThumbURL(fileHandlerId) : null;
});

const sortedPreviewableWidgetDefs = computed(() => {
  return (
    props.template.widgetArray
      // only previewable widgets
      .filter((widgetDef) => {
        return widgetDef.displayInPreview;
      })
      // sort by `viewOrder`
      .sort((a, b) => {
        return a.viewOrder - b.viewOrder;
      })
  );
});
</script>
<style scoped></style>
