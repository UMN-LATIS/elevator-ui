<template>
  <a :href="getAssetLink(contents.targetAssetId)">
    {{ getRelatedAssetTitle(assetCache.relatedAssetTitle) }}
  </a>
</template>

<script setup lang="ts">
import { Widget, RelatedAssetWidgetContents, RelatedAsset } from "@/types";
import { getAssetLink, getRelatedAssetTitle } from "@/Helpers/displayUtils";

defineProps<{
  widget: Widget;
  contents: RelatedAssetWidgetContents;
  assetCache: RelatedAsset;
}>();
</script>
