<template>
  <div class="related-asset-widget">
    <Tuple
      v-for="relatedAsset in contentsWithAssetId"
      :key="relatedAsset.targetAssetId"
      :label="relatedAsset.label ?? ''"
    >
      <RelatedAssetWidgetItem
        :assetId="relatedAsset.targetAssetId"
        :title="
          asset.relatedAssetCache?.[relatedAsset.targetAssetId]
            ?.relatedAssetTitle?.[0] ?? '(no title)'
        "
      />
    </Tuple>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import {
  Asset,
  RelatedAssetWidgetProps,
  RelatedAssetWidgetContents,
} from "@/types";
import Tuple from "../Tuple.vue";
import RelatedAssetWidgetItem from "./RelatedAssetWidgetItem.vue";
import { getRelatedAssetTitle } from "@/Helpers/displayUtils";

const props = defineProps<{
  widget: RelatedAssetWidgetProps;
  contents: RelatedAssetWidgetContents[];
  asset: Asset;
}>();

type WithTargetAssetId<T> = T & { targetAssetId: string };

const contentsWithAssetId = computed(() =>
  props.contents.filter(
    (item): item is WithTargetAssetId<RelatedAssetWidgetContents> =>
      !!item.targetAssetId
  )
);
</script>
<style scoped></style>
