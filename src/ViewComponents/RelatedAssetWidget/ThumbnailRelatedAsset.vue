<template>
  <img
    v-if="assetCache.primaryHandler"
    :src="getTinyURL(assetCache.primaryHandler)"
    :alt="assetCache.relatedAssetTitle[0]"
    @click="setAssetInStore(assetCache.primaryHandler, content.targetAssetId)"
  />
</template>

<script setup lang="ts">
import { Widget, RelatedWidgetContents, RelatedAsset } from "@/types";
import { getTinyURL, setAssetInStore } from "@/Helpers/displayUtils";

defineProps<{
  widget: Widget;
  content: RelatedWidgetContents;
  assetCache: RelatedAsset;
}>();
</script>
