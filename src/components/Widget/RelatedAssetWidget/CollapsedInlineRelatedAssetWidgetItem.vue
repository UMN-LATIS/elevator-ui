<template>
  <section
    v-if="asset"
    class="collapsed-inline-related-asset-widget-item flex flex-col gap-8"
  >
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
  assetCache: RelatedAssetCacheItem | null;
}>();

const title = computed(() => getTitleFromCacheItem(props.assetCache));
const assetIdRef = computed(() => props.assetId);
const { asset } = useAsset(assetIdRef);
</script>
<style scoped></style>
