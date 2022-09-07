<template>
  <div class="thumbnail-related-asset-widget-item">
    <button @click="assetStore.setActiveObject(assetId)">
      <figure
        class="w-[100px] h-[100px] overflow-hidden rounded border border-white"
        :class="{
          'outline outline-2 outline-offset-2': isActiveObject,
        }"
      >
        <img
          v-if="assetCache.primaryHandler"
          class="object-fit"
          :src="getTinyURL(assetCache.primaryHandler)"
          :alt="title"
        />
        <div v-else>
          <span class="material-symbols-outlined"> image </span>
          {{ title }}
        </div>
        <figcaption>{{ title }}</figcaption>
      </figure>
    </button>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { getTinyURL } from "@/Helpers/displayUtils";
import type { RelatedAssetCacheItem } from "@/types";
import { useAssetStore } from "@/stores/assetStore";
import { getTitleFromCacheItem } from "./getTitleFromCacheItem";

const props = defineProps<{
  assetId: string;
  assetCache: RelatedAssetCacheItem;
}>();

const assetStore = useAssetStore();

const title = computed((): string => getTitleFromCacheItem(props.assetCache));

const isActiveObject = computed(
  (): boolean => assetStore.activeObjectId === props.assetId
);
</script>
<style scoped></style>
