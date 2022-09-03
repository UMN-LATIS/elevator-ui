<template>
  <div v-if="asset && template" class="widget-list flex flex-col gap-8">
    <Widget
      v-for="widget in widgets"
      :key="widget.widgetId"
      :widget="widget"
      :asset="asset"
      :template="template"
    />
  </div>
</template>
<script setup lang="ts">
/**
 * lists all the asset's widget as defined by the asset
 * template
 */
import { ref, watchEffect, computed } from "vue";
import { useAssetStore } from "@/stores/newAssetStore";
import type { Template, Asset } from "@/types";
import { getSortedWidgets } from "@/Helpers/displayUtils";
import Widget from "@/components/Widget.vue";

const props = defineProps<{
  assetId: string;
}>();

const assetStore = useAssetStore();
const asset = ref<Asset | null>(null);
const template = ref<Template | null>(null);

watchEffect(async () => {
  asset.value = props.assetId
    ? await assetStore.fetchAsset(props.assetId)
    : null;
  template.value = asset.value
    ? await assetStore.fetchTemplateForAsset(props.assetId)
    : null;
});

const widgets = computed(() =>
  getSortedWidgets({ asset: asset.value, template: template.value })
);
</script>
