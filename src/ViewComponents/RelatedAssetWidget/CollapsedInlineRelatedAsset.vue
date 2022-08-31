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
  RelatedAssetWidget,
  RelatedAssetWidgetContents,
  RelatedAsset,
} from "@/types";
import { getRelatedAssetTitle } from "@/Helpers/displayUtils";
import ViewWrapper from "@/ViewComponents/ViewWrapper.vue";

defineProps<{
  widget: RelatedAssetWidget;
  content: RelatedAssetWidgetContents;
  assetCache: RelatedAsset;
}>();
</script>
