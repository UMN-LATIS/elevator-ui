<template>
  <Tooltip :tip="isTitleVisible ? title : ''">
    <RouterLink
      class="thumbnail-related-asset-widget flex flex-col rounded-md border border-transparent p-1 no-underline hover:no-underline hover:bg-primary-container hover:text-primary w-24 text-on-surface-variant"
      :class="{
        'opacity-80 hover:opacity-100 hover:border-primary': !isActiveObject,
        'ring ring-offset-1 ring-primary hover:border-transparent opacity-100 bg-primary-container':
          isActiveObject,
      }"
      :to="`#${assetId}`">
      <!-- When the title text renders below, it is the link's accessible
        name, so alt is empty to avoid a double announcement. See
        https://www.w3.org/WAI/tutorials/images/functional/ example 2 -->
      <ThumbnailImage
        v-if="assetCacheItem?.primaryHandler"
        :src="getTinyURL(assetCacheItem.primaryHandler)"
        :alt="isTitleVisible ? '' : title"
        class="thumbnail-related-asset-widget__image max-w-full" />
      <ThumbnailGeneric v-else :isActive="isActiveObject" />

      <SanitizedHTML
        v-if="isTitleVisible"
        class="whitespace-nowrap text-xs mt-1 truncate overflow-hidden w-full text-center"
        :html="title" />
    </RouterLink>
  </Tooltip>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { getTinyURL } from "@/helpers/displayUtils";
import ThumbnailImage from "@/components/ThumbnailImage/ThumbnailImage.vue";
import ThumbnailGeneric from "@/components/ThumbnailGeneric/ThumbnailGeneric.vue";
import SanitizedHTML from "@/components/SanitizedHTML/SanitizedHTML.vue";
import Tooltip from "@/components/Tooltip/Tooltip.vue";
import { useElevatorInstance } from "@/composables/useElevatorInstance";
import { RelatedAssetCacheItem } from "@/types";

defineProps<{
  assetId: string;
  title: string;
  isActiveObject: boolean;
  assetCacheItem: RelatedAssetCacheItem | null;
}>();

const { instance } = useElevatorInstance();

// with the title hidden, the text serves as alt text only
const isTitleVisible = computed(
  () => instance.value?.showThumbnailDescription ?? false
);
</script>
<style scoped></style>
