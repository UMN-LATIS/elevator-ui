<template>
  <div class="linked-related-asset-widget-item">
    <Link :to="assetUrl">{{ title }}</Link>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import type { RelatedAssetCacheItem } from "@/types";
import { getTitleFromCacheItem } from "./getTitleFromCacheItem";
import { getAssetUrl } from "@/helpers/displayUtils";
import Link from "@/components/Link/Link.vue";

const props = defineProps<{
  assetId: string;
  assetCache: RelatedAssetCacheItem | null;
}>();

const title = computed((): string => getTitleFromCacheItem(props.assetCache));
const assetUrl = computed((): string => getAssetUrl(props.assetId));
</script>
<style scoped></style>
