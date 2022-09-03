<template>
  <component :is="href ? 'a' : 'span'" :href="href">
    {{ getRelatedAssetTitle(assetCache.relatedAssetTitle) }}
  </component>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { WidgetProps, RelatedAssetWidgetContents, RelatedAsset } from "@/types";
import { getAssetUrl, getRelatedAssetTitle } from "@/Helpers/displayUtils";

const props = defineProps<{
  widget: WidgetProps;
  content: RelatedAssetWidgetContents;
  assetCache: RelatedAsset;
}>();

const href = computed(() =>
  props.content.targetAssetId ? getAssetUrl(props.content.targetAssetId) : ""
);
</script>
