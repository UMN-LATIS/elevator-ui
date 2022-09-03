<template>
  <div class="related-asset-widget">
    <Accordion :label="widget.label" @toggle="handleAccordionToggle">
      <Tuple
        v-for="(relatedAsset, i) in contents"
        :key="relatedAsset.targetAssetId || i"
        :label="relatedAsset.label || 'Unknown'"
      >
        <Suspense>
          {{ getAssetValue(relatedAsset.targetAssetId) }}
          <template #loading> Loading... </template>
        </Suspense>
      </Tuple>
    </Accordion>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
import {
  Asset,
  RelatedAssetWidgetProps,
  RelatedAssetWidgetContents,
} from "@/types";
import Accordion from "../Accordion.vue";
import Tuple from "../Tuple.vue";
import { useAssetStore } from "@/stores/newAssetStore";

const props = defineProps<{
  widget: RelatedAssetWidgetProps;
  contents: RelatedAssetWidgetContents[];
  asset: Asset;
}>();

const assetStore = useAssetStore();

function handleAccordionToggle() {
  // props.contents.forEach(({ targetAssetId, label }) => {});
}

async function getAssetValue(id: string | null): Promise<string> {
  if (!id) return "-";

  const asset = await assetStore.fetchAsset(id);
  return JSON.stringify(asset);
}

console.log({
  widget: props.widget,
  contents: props.contents,
  asset: props.asset,
});
</script>
<style scoped></style>
