<template>
  <div
    class="related-asset-widget flex flex-wrap w-full"
    :class="{
      'flex-col gap-1 leading-5': widgetType === LinkedRelatedAssetWidgetItem,
      'gap-2': widgetType !== LinkedRelatedAssetWidgetItem,
    }">
    <component
      :is="widgetType"
      v-for="relatedAsset in contentsWithAssetId"
      :key="relatedAsset.targetAssetId"
      :isActiveObject="assetStore.activeObjectId === relatedAsset.targetAssetId"
      :assetId="relatedAsset.targetAssetId"
      :assetCacheItem="asset.relatedAssetCache?.[relatedAsset.targetAssetId]"
      :label="relatedAsset.label ?? ''">
      <div class="flex items-center justify-end gap-2">
        <ArrowButton :to="`/asset/viewAsset/${relatedAsset.targetAssetId}`" />
      </div>
    </component>
  </div>
</template>
<script setup lang="ts">
import { type Component, computed, onMounted, onBeforeUnmount } from "vue";
import {
  Asset,
  RelatedAssetWidgetProps,
  RelatedAssetWidgetContent,
} from "@/types";
import AccordionRelatedAssetWidgetItem from "./AccordionRelatedAssetWidgetItem.vue";
import CollapsedInlineRelatedAssetWidgetItem from "./CollapsedInlineRelatedAssetWidgetItem.vue";
import ThumbnailRelatedAssetWidgetItem from "./ThumbnailRelatedAssetWidgetItem.vue";
import LinkedRelatedAssetWidgetItem from "./LinkedRelatedAssetWidgetItem.vue";
import ArrowButton from "@/components/ArrowButton/ArrowButton.vue";
import { useAssetStore } from "@/stores/assetStore";

const props = defineProps<{
  widget: RelatedAssetWidgetProps;
  contents: RelatedAssetWidgetContent[];
  asset: Asset;
}>();

type WithTargetAssetId<T> = T & { targetAssetId: string };

const assetStore = useAssetStore();

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

const activeIndex = computed(() =>
  contentsWithAssetId.value.findIndex(
    (item) => item.targetAssetId === assetStore.activeObjectId
  )
);

const hasActiveObjectWithin = computed(() => activeIndex.value !== -1);

function setPrevObjectAsActive() {
  const prevIndex =
    (activeIndex.value - 1 + props.contents.length) % props.contents.length;
  const prevObjectId = contentsWithAssetId.value[prevIndex].targetAssetId;
  assetStore.setActiveObject(prevObjectId);
}

function setNextObjectAsActive() {
  const nextIndex = (activeIndex.value + 1) % props.contents.length;
  const nextObjectId = contentsWithAssetId.value[nextIndex].targetAssetId;
  assetStore.setActiveObject(nextObjectId);
}

// within a widget, pressing the left or right arrow keys will
// navigate to the previous or next file
function handleNextPrevArrowPresses(event: KeyboardEvent) {
  if (!hasActiveObjectWithin.value) return;

  if (event.key === "ArrowLeft") {
    return setPrevObjectAsActive();
  }
  if (event.key === "ArrowRight") {
    return setNextObjectAsActive();
  }
}

const isThumbnailRelatedAsset = computed(
  () => widgetType.value === ThumbnailRelatedAssetWidgetItem
);

onMounted(() => {
  // only listen for key presses if there are multiple assets
  // and this is a thumbnail related asset widget
  if (!isThumbnailRelatedAsset.value || contentsWithAssetId.value.length < 2) {
    return;
  }
  window.addEventListener("keydown", handleNextPrevArrowPresses);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleNextPrevArrowPresses);
});
</script>
<style scoped></style>
