<template>
  <div class="accordion-related-asset-widget-item w-full max-w-lg">
    <Accordion :label="title">
      <template v-if="assetCacheItem?.primaryHandler" #label>
        <div
          v-if="assetCacheItem?.primaryHandler"
          class="flex items-center flex-1 w-full gap-4 py-2 pl-2 pr-4">
          <img
            v-if="assetCacheItem.primaryHandler"
            :src="getTinyURL(assetCacheItem.primaryHandler)"
            :alt="title"
            class="aspect-square h-10 overflow-hidden rounded"
            loading="lazy" />
          <h3>{{ title }}</h3>
        </div>
      </template>
      <ErrorBoundary>
        <WidgetList :assetId="assetId" />
      </ErrorBoundary>
      <slot />
    </Accordion>
  </div>
</template>
<script setup lang="ts">
import Accordion from "@/components/Accordion/Accordion.vue";
import ErrorBoundary from "@/components/ErrorBoundary/ErrorBoundary.vue";
import WidgetList from "@/components/WidgetList/WidgetList.vue";
import { getTinyURL } from "@/helpers/displayUtils";
import { RelatedAssetCacheItem } from "@/types";
defineProps<{
  assetId: string;
  title: string;
  assetCacheItem: RelatedAssetCacheItem | null;
}>();
</script>
<style scoped></style>
