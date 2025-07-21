<template>
  <section
    v-if="asset"
    class="collapsed-inline-related-asset-widget-item flex flex-col">
    <h3>{{ title }}</h3>
    <WidgetList :assetId="assetId" />
  </section>
</template>
<script setup lang="ts">
import WidgetList from "@/components/WidgetList/WidgetList.vue";
import { computed } from "vue";
import type { RelatedAssetCacheItem } from "@/types";
import { getTitleFromCacheItem } from "./getTitleFromCacheItem";
import { useAsset } from "@/helpers/useAsset";

const props = defineProps<{
  assetId: string;
  assetCacheItem: RelatedAssetCacheItem | null;
}>();

const title = computed(() => getTitleFromCacheItem(props.assetCacheItem));
const assetIdRef = computed(() => props.assetId);
const { asset } = useAsset(assetIdRef);
</script>
<style scoped>
.collapsed-inline-related-asset-widget-item {
  gap: var(--app-panel-body-items-gap);
}
</style>
