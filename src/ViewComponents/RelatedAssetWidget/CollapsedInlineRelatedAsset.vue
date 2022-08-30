<template>
  <div>
    {{ getRelatedAssetTitle(assetCache.relatedAssetTitle) }}
    <ViewWrapper :objectId="content.targetAssetId" :isPrimaryElement="false">
    </ViewWrapper>
  </div>
</template>

<script setup lang="ts">
import { Widget, RelatedWidgetContents, RelatedAsset } from "@/types";
import { getRelatedAssetTitle } from "@/Helpers/displayUtils";
import ViewWrapper from "@/ViewComponents/ViewWrapper.vue";

defineProps<{
  widget: Widget;
  content: RelatedWidgetContents;
  assetCache: RelatedAsset;
}>();
</script>
