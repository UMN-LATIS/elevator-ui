<template>
  <div v-if="asset" class="asset-details">
    <Drawer :label="assetTitle">
      <template v-for="widget in widgets" :key="widget.id">
        <Widget :widget="widget" :asset="asset" :template="template" />
      </template>
    </Drawer>
  </div>
</template>
<script setup lang="ts">
import { ref, watchEffect, computed } from "vue";
import { useAssetStore } from "@/stores/newAssetStore";
import Widget from "@/components/Widget.vue";
import type { Asset, Template } from "@/types";
import Drawer from "./Drawer.vue";
import { getSortedWidgets, getAssetTitle } from "@/Helpers/displayUtils";

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

const assetTitle = computed(() =>
  getAssetTitle({ asset: asset.value, template: template.value })
);

const widgets = computed(() =>
  getSortedWidgets({ asset: asset.value, template: template.value })
);
</script>
<style scoped></style>
