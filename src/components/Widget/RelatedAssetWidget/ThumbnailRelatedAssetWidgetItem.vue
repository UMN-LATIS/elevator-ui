<template>
  <RouterLink
    :title="title"
    class="thumbnail-related-asset-widget-image inline-flex"
    :to="`#${assetId}`"
  >
    <ThumbnailImage
      v-if="assetCache.primaryHandler"
      :src="getTinyURL(assetCache.primaryHandler)"
      :alt="title"
      :isActive="isActiveObject"
      iconOnHover="arrow_forward"
    />
    <ThumbnailGeneric v-else :isActive="isActiveObject">
      {{ title }}
    </ThumbnailGeneric>
  </RouterLink>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { getTinyURL } from "@/helpers/displayUtils";
import type { RelatedAssetCacheItem } from "@/types";
import { useAssetStore } from "@/stores/assetStore";
import { getTitleFromCacheItem } from "./getTitleFromCacheItem";
import ThumbnailImage from "@/components/ThumbnailImage/ThumbnailImage.vue";
import ThumbnailGeneric from "@/components/ThumbnailGeneric/ThumbnailGeneric.vue";

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
<style scoped>
.thumbnail-related-asset-widget-image {
  background: var(--app-thumbnailImage-backgroundColor);
  color: var(--app-thumbnailImage-textColor);
}
</style>
