<template>
  <Transition name="fade">
    <div v-if="asset && template" class="widget-list flex flex-col">
      <Widget
        v-for="widget in widgets"
        :key="widget.widgetId"
        :widget="widget"
        :asset="asset" />
    </div>
  </Transition>
</template>
<script setup lang="ts">
/**
 * lists all the asset's widget as defined by the asset
 * template
 */
import { computed } from "vue";
import { getWidgetsForDisplay } from "@/helpers/displayUtils";

import Widget from "@/components/Widget/Widget.vue";
import { useAsset } from "@/helpers/useAsset";

const props = defineProps<{
  assetId: string;
}>();

const assetIdRef = computed(() => props.assetId);
const { asset, template } = useAsset(assetIdRef);
const widgets = computed(() =>
  getWidgetsForDisplay({ asset: asset.value, template: template.value })
);
</script>
<style scoped>
.widget-list {
  gap: var(--app-widgetList-gap);
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
