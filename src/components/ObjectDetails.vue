<template>
  <div v-if="objectAsset" class="asset-details">
    <Drawer label="Details" variant="secondary">
      <template v-for="widget in widgets" :key="widget.id">
        <Widget :widget="widget" :asset="objectAsset" :template="template" />
      </template>
    </Drawer>
  </div>
</template>
<script setup lang="ts">
import { ref, watchEffect, computed } from "vue";
import { useAssetStore } from "@/stores/newAssetStore";
import { Asset, Template } from "@/types";
import { getSortedWidgets } from "@/Helpers/displayUtils";
import Drawer from "./Drawer.vue";
import Widget from "./Widget.vue";

const props = defineProps<{
  objectId: string;
}>();

const objectAsset = ref<Asset | null>(null);
const assetStore = useAssetStore();
const template = ref<Template | null>(null);

watchEffect(async () => {
  objectAsset.value = props.objectId
    ? await assetStore.fetchAsset(props.objectId)
    : null;
  template.value = objectAsset.value
    ? await assetStore.fetchTemplateForAsset(props.objectId)
    : null;
});

const widgets = computed(() =>
  getSortedWidgets({ asset: objectAsset.value, template: template.value })
);
</script>

<style scoped></style>
