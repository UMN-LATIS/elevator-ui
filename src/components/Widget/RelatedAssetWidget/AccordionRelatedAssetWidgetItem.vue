<template>
  <div class="accordion-related-asset-widget-item">
    <Accordion :label="title">
      <template v-if="assetCache?.primaryHandler" #label>
        <div
          v-if="assetCache?.primaryHandler"
          class="flex gap-2 items-center w-full flex-1"
        >
          <div class="w-[2rem] h-[2rem] overflow-hidden rounded border">
            <img
              :src="getTinyURL(assetCache.primaryHandler)"
              :alt="title"
              class="object-cover w-full h-full"
            />
          </div>
          <h3>{{ title }}</h3>
        </div>
      </template>
      <WidgetList :assetId="assetId" />
      <slot />
    </Accordion>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import Accordion from "@/components/Accordion/Accordion.vue";
import WidgetList from "@/components/WidgetList/WidgetList.vue";
import { RelatedAssetCacheItem } from "@/types";
import { getTitleFromCacheItem } from "./getTitleFromCacheItem";
import { getTinyURL } from "@/Helpers/displayUtils";

const props = defineProps<{
  assetId: string;
  assetCache: RelatedAssetCacheItem | null;
}>();

const title = computed(() => getTitleFromCacheItem(props.assetCache));
</script>
<style scoped></style>
