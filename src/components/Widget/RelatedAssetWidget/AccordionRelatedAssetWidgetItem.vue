<template>
  <div class="accordion-related-asset-widget-item">
    <Accordion :label="title">
      <WidgetList :assetId="assetId" />
    </Accordion>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import Accordion from "@/components/Accordion/Accordion.vue";
import WidgetList from "@/components/WidgetList/WidgetList.vue";
import { RelatedAssetCacheItem } from "@/types";
import { getTitleFromCacheItem } from "./getTitleFromCacheItem";

const props = defineProps<{
  assetId: string;
  assetCache: RelatedAssetCacheItem | null;
}>();

const title = computed(() => getTitleFromCacheItem(props.assetCache));
</script>
<style scoped></style>
