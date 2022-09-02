<template>
  <a :href="getAssetLink(contents.targetAssetId)">
    {{ getRelatedAssetTitle(assetCache.relatedAssetTitle) }}
  </a>
</template>

<script setup lang="ts">
import { WidgetProps, RelatedAssetWidgetContents, RelatedAsset } from "@/types";
import { getAssetLink, getRelatedAssetTitle } from "@/Helpers/displayUtils";

defineProps<{
  widget: WidgetProps;
  contents: RelatedAssetWidgetContents;
  assetCache: RelatedAsset;
}>();
</script>
