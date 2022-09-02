<template>
  <div>
    {{ getRelatedAssetTitle(assetCache.relatedAssetTitle) }}
    <ViewWrapper
      v-if="content.targetAssetId"
      :objectId="content.targetAssetId"
      :isPrimaryElement="false"
    >
    </ViewWrapper>
  </div>
</template>

<script setup lang="ts">
import {
  RelatedAssetWidgetProps,
  RelatedAssetWidgetContents,
  RelatedAsset,
} from "@/types";
import { getRelatedAssetTitle } from "@/Helpers/displayUtils";
import ViewWrapper from "@/ViewComponents/ViewWrapper.vue";

defineProps<{
  widget: RelatedAssetWidgetProps;
  content: RelatedAssetWidgetContents;
  assetCache: RelatedAsset;
}>();
</script>
