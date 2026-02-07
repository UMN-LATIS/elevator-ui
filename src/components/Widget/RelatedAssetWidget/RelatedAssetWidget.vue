<template>
  <!-- Stop rendering if we've detected a cycle or exceeded max depth -->
  <div v-if="isCycle || isTooDeep" class="text-sm text-on-surface-variant italic p-2">
    <span v-if="isCycle">
      Circular reference detected - stopping to prevent infinite loop
    </span>
    <span v-else>Maximum nesting depth reached</span>
  </div>

  <div
    v-else
    class="related-asset-widget flex flex-wrap w-full"
    :class="{
      'flex-col gap-1 leading-5': widgetType === LinkedRelatedAssetWidgetItem,
      'gap-2': widgetType !== LinkedRelatedAssetWidgetItem,
    }">
    <component
      :is="widgetType"
      v-for="relatedAsset in safeContents"
      :key="relatedAsset.targetAssetId"
      :isActiveObject="assetStore.activeObjectId === relatedAsset.targetAssetId"
      :assetId="relatedAsset.targetAssetId"
      :assetCacheItem="relatedAsset.cacheItem"
      :title="relatedAsset.title">
      <div class="flex items-center justify-end gap-2">
        <ArrowButton :to="`/asset/viewAsset/${relatedAsset.targetAssetId}`" />
      </div>
    </component>
  </div>
</template>
<script setup lang="ts">
import {
  type Component,
  type InjectionKey,
  computed,
  inject,
  onMounted,
  onBeforeUnmount,
  provide,
} from "vue";
import {
  Asset,
  RelatedAssetWidgetDef,
  RelatedAssetWidgetContent,
  RelatedAssetCacheItem,
  RelatedAssetCache,
} from "@/types";
import AccordionRelatedAssetWidgetItem from "./AccordionRelatedAssetWidgetItem.vue";
import CollapsedInlineRelatedAssetWidgetItem from "./CollapsedInlineRelatedAssetWidgetItem.vue";
import ThumbnailRelatedAssetWidgetItem from "./ThumbnailRelatedAssetWidgetItem.vue";
import LinkedRelatedAssetWidgetItem from "./LinkedRelatedAssetWidgetItem.vue";
import ArrowButton from "@/components/ArrowButton/ArrowButton.vue";
import { useAssetStore } from "@/stores/assetStore";

// Cycle detection: track which asset IDs are ancestors in the render tree
const ANCESTOR_ASSET_IDS_KEY: InjectionKey<Set<string>> =
  Symbol("ancestorAssetIds");
const MAX_NESTING_DEPTH = 10;

const props = defineProps<{
  widget: RelatedAssetWidgetDef;
  contents: RelatedAssetWidgetContent[];
  asset: Asset;
}>();

// Get ancestors from parent, or start with empty set at root level
const ancestorAssetIds: Set<string> =
  inject(ANCESTOR_ASSET_IDS_KEY) ?? new Set<string>();
const currentAssetId = props.asset.assetId;

// Detect if we've hit a cycle (current asset already rendered above us)
const isCycle = ancestorAssetIds.has(currentAssetId);

// Detect if we've gone too deep (safety net)
const isTooDeep = ancestorAssetIds.size >= MAX_NESTING_DEPTH;

// Provide updated ancestors to children (add current asset to the chain)
const childAncestors = new Set<string>(ancestorAssetIds);
childAncestors.add(currentAssetId);
provide(ANCESTOR_ASSET_IDS_KEY, childAncestors);

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
  props.contents
    .filter(
      (item): item is WithTargetAssetId<RelatedAssetWidgetContent> =>
        !!item.targetAssetId
    )
    .map((relatedAsset) => {
      const cacheItem = getRelatedAssetCacheItem(
        relatedAsset.targetAssetId,
        props.asset.relatedAssetCache
      );
      return {
        ...relatedAsset,
        cacheItem,
        title: getRelatedAssetTitle({
          cacheItem,
          label: relatedAsset.label ?? "",
          widgetDef: props.widget,
        }),
      };
    })
);

// Filter out any related assets that would create a cycle
const safeContents = computed(() =>
  contentsWithAssetId.value.filter(
    (item) => !childAncestors.has(item.targetAssetId)
  )
);

const activeIndex = computed(() =>
  contentsWithAssetId.value.findIndex(
    (item) => item.targetAssetId === assetStore.activeObjectId
  )
);

const hasActiveObjectWithin = computed(() => activeIndex.value !== -1);

function getRelatedAssetCacheItem(
  targetAssetId: string,
  relatedAssetCache: RelatedAssetCache | never[] | null
): RelatedAssetCacheItem | null {
  return relatedAssetCache?.[targetAssetId] ?? null;
}

function getRelatedAssetTitle({
  cacheItem,
  widgetDef,
  label,
}: {
  cacheItem: RelatedAssetCacheItem | null;
  widgetDef: RelatedAssetWidgetDef;
  label: string;
}): string {
  const relatedAssetTitleArr: string[] = cacheItem?.relatedAssetTitle ?? [];
  const trimmedTitle: string = relatedAssetTitleArr?.[0]?.trim() ?? "";
  const trimmedLabel: string = label.trim();
  const shouldShowLabel =
    widgetDef.fieldData.showLabel &&
    trimmedLabel.length > 0 &&
    trimmedLabel !== trimmedTitle;

  if (!shouldShowLabel) {
    return trimmedTitle || "(No Title)";
  }
  return `${trimmedTitle} (${trimmedLabel})`;
}

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
