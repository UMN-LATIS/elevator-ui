<template>
  <RouterLink
    :title="title"
    class="inline-block mr-2 last:mr-0"
    :to="`#${assetId}`"
  >
    <ThumbnailImage
      v-if="assetCache.primaryHandler"
      :src="getTinyURL(assetCache.primaryHandler)"
      :alt="title"
      :isActive="isActiveObject"
      iconOnHover="arrow_forward"
    />
    <div v-else>
      <Icon>image</Icon>
      <p>{{ title }}</p>
    </div>
  </RouterLink>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { getTinyURL } from "@/helpers/displayUtils";
import type { RelatedAssetCacheItem } from "@/types";
import { useAssetStore } from "@/stores/assetStore";
import { getTitleFromCacheItem } from "./getTitleFromCacheItem";
import ThumbnailImage from "@/components/ThumbnailImage/ThumbnailImage.vue";
import Icon from "@/components/Icon/Icon.vue";

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
