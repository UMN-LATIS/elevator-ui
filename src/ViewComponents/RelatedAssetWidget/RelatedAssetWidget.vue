<template>
  <ul>
    <li v-for="(content, key) in contents" :key="key">
      <component
        :is="type"
        :content="content"
        :widget="widget"
        :assetCache="getAssetCache(content)"
      ></component>
    </li>
  </ul>
</template>

<script setup lang="ts">
import CollapsedInlineRelatedAsset from "@/ViewComponents/RelatedAssetWidget/CollapsedInlineRelatedAsset.vue";
import LinkedItemRelatedAsset from "@/ViewComponents/RelatedAssetWidget/LinkedItemRelatedAsset.vue";
import ThumbnailRelatedAsset from "@/ViewComponents/RelatedAssetWidget/ThumbnailRelatedAsset.vue";
import TogglePanelRelatedAsset from "@/ViewComponents/RelatedAssetWidget/TogglePanelRelatedAsset.vue";
import {
  RelatedAssetWidgetProps,
  RelatedAssetWidgetContents,
  Asset,
} from "@/types";
import { computed } from "vue";

interface Props {
  widget: RelatedAssetWidgetProps;
  contents: RelatedAssetWidgetContents[];
  asset: Asset;
}

const props = defineProps<Props>();

const type = computed(() => {
  if (props.widget.fieldData.collapseNestedChildren == true) {
    return CollapsedInlineRelatedAsset;
  }
  if (props.widget.fieldData.thumbnailView == true) {
    return ThumbnailRelatedAsset;
  }
  if (props.widget.fieldData.nestData == false) {
    return LinkedItemRelatedAsset;
  }

  return TogglePanelRelatedAsset;
});

const getAssetCache = (content: RelatedAssetWidgetContents) => {
  if (content.targetAssetId === null) {
    throw new Error("Cannot get asset cache. `targetAssetId` is null");
  }
  return props.asset.relatedAssetCache?.[content.targetAssetId] ?? null;
};
</script>
