<template>
  <Transition name="fade">
    <div v-if="asset && template" class="widget-list flex flex-col gap-8">
      <Widget
        v-for="widget in widgets"
        :key="widget.widgetId"
        :widget="widget"
        :asset="asset"
        :template="template"
      />
    </div>
  </Transition>
</template>
<script setup lang="ts">
/**
 * lists all the asset's widget as defined by the asset
 * template
 */
import { ref, watch, computed, provide, inject } from "vue";
import { useAssetStore } from "@/stores/newAssetStore";
import type { Template, Asset } from "@/types";
import { getWidgetsForDisplay } from "@/Helpers/displayUtils";
import Widget from "@/components/Widget.vue";
import { getWidgetNestingDepthProviderKey } from "@/constants";

const props = defineProps<{
  assetId: string;
}>();

const assetStore = useAssetStore();
const asset = ref<Asset | null>(null);
const template = ref<Template | null>(null);

watch(
  () => props.assetId,
  async () => {
    [asset.value, template.value] = await Promise.all([
      assetStore.fetchAsset(props.assetId),
      assetStore.fetchTemplateForAsset(props.assetId),
    ]);
  },
  { immediate: true }
);

const widgets = computed(() =>
  getWidgetsForDisplay({ asset: asset.value, template: template.value })
);

watch(widgets, () => console.log({ widgets: widgets.value }), {
  immediate: true,
});

const getWidgetNestingDepth = inject(getWidgetNestingDepthProviderKey, () => 0);
provide(getWidgetNestingDepthProviderKey, () => {
  const prevNestingDepth = getWidgetNestingDepth();
  return prevNestingDepth + 1;
});
</script>
<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
