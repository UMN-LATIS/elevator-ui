<template>
  <ul>
    <li v-for="(content, key) in contents" :key="key">
      <component :is="type" :content="content" :widget="widget" :assetCache="getAssetCache(content)"></component>
    </li>
  </ul>
</template>

<script setup lang="ts">
import CollapsedInlineRelatedAsset from "@/ViewComponents/RelatedAssetWidget/CollapsedInlineRelatedAsset.vue";
import LinkedItemRelatedAsset from "@/ViewComponents/RelatedAssetWidget/LinkedItemRelatedAsset.vue";
import ThumbnailRelatedAsset from "@/ViewComponents/RelatedAssetWidget/ThumbnailRelatedAsset.vue";
import TogglePanelRelatedAsset from "@/ViewComponents/RelatedAssetWidget/TogglePanelRelatedAsset.vue";
import { Widget, RelatedWidgetContents } from "@/types";
import { computed } from "vue";


const components = {
  CollapsedInlineRelatedAsset,
  LinkedItemRelatedAsset,
  ThumbnailRelatedAsset
};



interface Props {
  widget: Widget;
  contents: RelatedWidgetContents[];
  asset: any;
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

const getAssetCache = (content) => {
  return props.asset.relatedAssetCache[content.targetAssetId]
};

</script>
