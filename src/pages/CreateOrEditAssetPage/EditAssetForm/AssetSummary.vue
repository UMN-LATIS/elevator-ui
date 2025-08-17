<template>
  <div
    class="grid grid-cols-[1fr,auto] md:grid-cols-[auto,1fr] items-center md:items-start gap-4">
    <div
      class="size-16 md:size-24 bg-black/5 rounded-lg overflow-hidden order-2 md:order-1 flex items-center justify-center border border-black/10">
      <img
        v-if="typeof asset.firstFileHandlerId === 'string' && previewImageUrl"
        :src="previewImageUrl"
        class="w-full h-full object-cover" />
      <p v-else class="text-[0.5rem] p-1">No image yet</p>
    </div>
    <div class="order-1 md:order-2">
      <Transition name="fade" mode="out-in">
        <header v-if="isCreatingNewAsset" class="md:mb-4">
          <h1 class="text-xs md:text-base font-bold uppercase text-black/25">
            Create Asset
          </h1>
          <h2 class="text-xl md:text-2xl font-bold">New Asset</h2>
        </header>
        <header v-else class="md:mb-4">
          <h1 class="text-xs md:text-base font-bold uppercase text-black/25">
            Edit Asset
          </h1>
          <h2 class="text-xl md:text-2xl font-bold">
            {{ savedAssetTitle || localAssetTitle }}
          </h2>
        </header>
      </Transition>
    </div>
  </div>
</template>
<script setup lang="ts">
import * as Types from "@/types";
import { usePreviewImage } from "@/helpers/usePreviewImage";
import { computed } from "vue";

const props = defineProps<{
  asset: Types.Asset | Types.UnsavedAsset;
  template: Types.Template;
  savedAssetTitle: string;
  localAssetTitle: string;
}>();

// Use a getter function so the composable reacts to prop changes
const { previewImageUrl } = usePreviewImage(() =>
  typeof props.asset.firstFileHandlerId === "string"
    ? props.asset.firstFileHandlerId
    : null
);

const isCreatingNewAsset = computed(() => {
  return !props.asset.assetId;
});
</script>
<style scoped></style>
