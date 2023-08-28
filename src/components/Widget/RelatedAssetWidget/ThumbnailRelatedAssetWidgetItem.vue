<template>
  <RouterLink
    :title="title"
    class="thumbnail-related-asset-widget flex flex-col rounded-md border border-transparent p-1 no-underline hover:no-underline hover:bg-blue-50 hover:text-blue-600 w-24 text-neutral-600"
    :class="{
      'opacity-80 hover:opacity-100 hover:border-blue-600': !isActiveObject,
      'ring ring-offset-1 ring-blue-600 hover:border-transparent opacity-100 bg-blue-50':
        isActiveObject,
    }"
    :to="`#${assetId}`"
  >
    <ThumbnailImage
      v-if="assetCacheItem.primaryHandler"
      :src="getTinyURL(assetCacheItem.primaryHandler)"
      :alt="title"
      class="thumbnail-related-asset-widget__image max-w-full"
    />
    <ThumbnailGeneric v-else :isActive="isActiveObject" />

    <SanitizedHTML
      class="whitespace-nowrap text-xs mt-1 truncate overflow-hidden w-full text-center"
      :html="title"
    />
  </RouterLink>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { getTinyURL } from "@/helpers/displayUtils";
import type { RelatedAssetCacheItem } from "@/types";
import { getTitleFromCacheItem } from "./getTitleFromCacheItem";
import ThumbnailImage from "@/components/ThumbnailImage/ThumbnailImage.vue";
import ThumbnailGeneric from "@/components/ThumbnailGeneric/ThumbnailGeneric.vue";
import SanitizedHTML from "@/components/SanitizedHTML/SanitizedHTML.vue";

const props = defineProps<{
  assetId: string;
  assetCacheItem: RelatedAssetCacheItem;
  isActiveObject: boolean;
}>();

const title = computed((): string =>
  getTitleFromCacheItem(props.assetCacheItem)
);
</script>
<style scoped></style>
