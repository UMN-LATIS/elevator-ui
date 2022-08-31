<template>
  <img
    v-if="assetCache.primaryHandler"
    :src="getTinyURL(assetCache.primaryHandler)"
    :alt="assetCache.relatedAssetTitle[0]"
    @click="handleImageClick"
  />
</template>

<script setup lang="ts">
import { Widget, RelatedAssetWidgetContents, RelatedAsset } from "@/types";
import { getTinyURL, setAssetInStore } from "@/Helpers/displayUtils";

const props = defineProps<{
  widget: Widget;
  content: RelatedAssetWidgetContents;
  assetCache: RelatedAsset;
}>();

function handleImageClick() {
  if (!props.assetCache?.primaryHandler) {
    throw new Error("Cannot set asset in store: no assetCache primaryHandler");
  }

  setAssetInStore(props.assetCache.primaryHandler, props.content.targetAssetId);
}
</script>
