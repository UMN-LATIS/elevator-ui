<template>
  <div class="related-asset-widget">
    <Tuple
      v-for="relatedAsset in contentsWithAssetId"
      :key="relatedAsset.targetAssetId"
      :label="relatedAsset.label ?? ''"
    >
      <component
        :is="widgetType"
        :assetId="relatedAsset.targetAssetId"
        :assetCache="asset.relatedAssetCache?.[relatedAsset.targetAssetId]"
      ></component>
    </Tuple>
  </div>
</template>
<script setup lang="ts">
import { type Component, computed } from "vue";
import {
  Asset,
  RelatedAssetWidgetProps,
  RelatedAssetWidgetContent,
} from "@/types";
import Tuple from "@/components/Tuple/Tuple.vue";
import AccordionRelatedAssetWidgetItem from "./AccordionRelatedAssetWidgetItem.vue";
import CollapsedInlineRelatedAssetWidgetItem from "./CollapsedInlineRelatedAssetWidgetItem.vue";
import ThumbnailRelatedAssetWidgetItem from "./ThumbnailRelatedAssetWidgetItem.vue";
import LinkedRelatedAssetWidgetItem from "./LinkedRelatedAssetWidgetItem.vue";

const props = defineProps<{
  widget: RelatedAssetWidgetProps;
  contents: RelatedAssetWidgetContent[];
  asset: Asset;
}>();

type WithTargetAssetId<T> = T & { targetAssetId: string };

const widgetType = computed((): Component => {
  if (props.widget.fieldData.collapseNestedChildren) {
    return CollapsedInlineRelatedAssetWidgetItem;
  }

  if (props.widget.fieldData.thumbnailView) {
    return ThumbnailRelatedAssetWidgetItem;
  }

  if (!props.widget.fieldData.nestData) {
    return LinkedRelatedAssetWidgetItem;
  }

  return AccordionRelatedAssetWidgetItem;
});

const contentsWithAssetId = computed(() =>
  props.contents.filter(
    (item): item is WithTargetAssetId<RelatedAssetWidgetContent> =>
      !!item.targetAssetId
  )
);
</script>
<style scoped></style>
