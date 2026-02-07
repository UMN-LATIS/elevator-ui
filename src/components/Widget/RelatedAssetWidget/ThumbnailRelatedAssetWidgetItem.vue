<template>
  <RouterLink
    :title="title"
    class="thumbnail-related-asset-widget flex flex-col rounded-md border border-transparent p-1 no-underline hover:no-underline hover:bg-primary-container hover:text-primary w-24 text-on-surface-variant"
    :class="{
      'opacity-80 hover:opacity-100 hover:border-primary': !isActiveObject,
      'ring ring-offset-1 ring-primary hover:border-transparent opacity-100 bg-primary-container':
        isActiveObject,
    }"
    :to="`#${assetId}`">
    <ThumbnailImage
      v-if="assetCacheItem.primaryHandler"
      :src="getTinyURL(assetCacheItem.primaryHandler)"
      :alt="title"
      class="thumbnail-related-asset-widget__image max-w-full" />
    <ThumbnailGeneric v-else :isActive="isActiveObject" />

    <SanitizedHTML
      class="whitespace-nowrap text-xs mt-1 truncate overflow-hidden w-full text-center"
      :html="title" />
  </RouterLink>
</template>
<script setup lang="ts">
import { getTinyURL } from "@/helpers/displayUtils";
import ThumbnailImage from "@/components/ThumbnailImage/ThumbnailImage.vue";
import ThumbnailGeneric from "@/components/ThumbnailGeneric/ThumbnailGeneric.vue";
import SanitizedHTML from "@/components/SanitizedHTML/SanitizedHTML.vue";
import { RelatedAssetCacheItem } from "@/types";

defineProps<{
  assetId: string;
  title: string;
  isActiveObject: boolean;
  assetCacheItem: RelatedAssetCacheItem;
}>();
</script>
<style scoped></style>
