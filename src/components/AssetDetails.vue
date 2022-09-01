<template>
  <div v-if="asset" class="asset-details">
    <Drawer :label="assetTitle">
      <template v-for="widget in sortedWidgetArray" :key="widget.id">
        <Widget
          v-if="widget && asset && template"
          :widget="widget"
          :asset="asset"
          :template="template"
        />
      </template>
    </Drawer>
  </div>
</template>
<script setup lang="ts">
import { ref, watchEffect, computed } from "vue";
import { useAssetStore } from "@/stores/newAssetStore";
import Widget from "@/components/Widget.vue";
import type { Asset, Template, Widget as TWidget } from "@/types";
import { WidgetType } from "@/types";
import Drawer from "./Drawer.vue";
import {
  getWidgetByFieldTitle,
  getWidgetContents,
} from "@/Helpers/displayUtils";

const props = defineProps<{
  assetId: string;
}>();

const assetStore = useAssetStore();
// sync asset with assetId
const asset = ref<Asset | null>(null);
watchEffect(async () => {
  asset.value = props.assetId
    ? await assetStore.fetchAsset(props.assetId)
    : null;
});

// sync template for this assetId
const template = ref<Template | null>(null);
watchEffect(async () => {
  template.value = asset.value
    ? await assetStore.fetchTemplateForAsset(props.assetId)
    : null;
});

const assetTitle = computed(() => {
  if (!asset.value || !template.value) {
    return "";
  }
  return "Untitled";
});

const sortedWidgetArray = computed((): TWidget[] => {
  if (!template.value || !asset.value) {
    return [];
  }

  const sortedWidgets = [...template.value.widgetArray].sort(
    (a, b) => a.viewOrder - b.viewOrder
  );

  // If the title is the same as a widget and
  // wouldn't look different, remove it
  const widgetsWithoutTitle = sortedWidgets.filter((widget) => {
    if (!template.value || !asset.value || !asset.value.titleObject) {
      return true;
    }

    const titleWidget = getWidgetByFieldTitle(
      template.value,
      asset.value.titleObject
    );

    const widgetContents = getWidgetContents({ asset: asset.value, widget });

    return (
      !titleWidget ||
      widget.type !== WidgetType.Text ||
      widget.fieldTitle !== titleWidget.fieldTitle ||
      widgetContents.length !== 1
    );
  });

  return widgetsWithoutTitle;
});
</script>
<style scoped></style>
