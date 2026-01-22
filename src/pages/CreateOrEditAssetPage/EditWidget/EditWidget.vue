<template>
  <ErrorBoundary>
    <component
      :is="getWidgetComponentByType(widgetDef.type)"
      :widgetDef="widgetDef"
      :widgetContents="widgetContents"
      :collectionId="collectionId"
      :assetId="assetId"
      :isOpen="isOpen"
      @update:isOpen="$emit('update:isOpen', $event)"
      @update:widgetContents="$emit('update:widgetContents', $event)"
      @save="$emit('save')" />
  </ErrorBoundary>
</template>
<script setup lang="ts">
import { type Component } from "vue";
import type { WidgetDef, WidgetContent } from "@/types";
import { WidgetType } from "@/types";
import EditSelectWidget from "./EditSelectWidget.vue";
import EditCheckboxWidget from "./EditCheckboxWidget.vue";
import EditTextAreaWidget from "./EditTextAreaWidget.vue";
import EditDateWidget from "./EditDateWidget.vue";
import EditMultiSelectWidget from "./EditMultiSelectWidget.vue";
import EditLocationWidget from "./EditLocationWidget.vue";
import EditUploadWidget from "./EditUploadWidget/EditUploadWidget.vue";
import EditTagWidget from "./EditTagWidget.vue";
import EditRelatedAssetWidget from "./EditRelatedAssetWidget/EditRelatedAssetWidget.vue";
import EditTextWidget from "./EditTextWidget.vue";
import ErrorBoundary from "@/components/ErrorBoundary/ErrorBoundary.vue";

defineProps<{
  widgetDef: WidgetDef;
  widgetContents: WidgetContent[];
  assetId: string | null; // new assets may have a null id
  collectionId: number;
  isOpen: boolean;
}>();

defineEmits<{
  (e: "update:widgetContents", widgetContents: WidgetContent[]): void;
  (e: "update:isOpen", isOpen: boolean): void;
  (e: "save"): void;
}>();

// map widgetTypeToComponent
const widgetMap: Record<WidgetType, Component> = {
  text: EditTextWidget,
  select: EditSelectWidget,
  checkbox: EditCheckboxWidget,
  "text area": EditTextAreaWidget,
  date: EditDateWidget,
  multiselect: EditMultiSelectWidget,
  location: EditLocationWidget,
  upload: EditUploadWidget,
  "tag list": EditTagWidget,
  "related asset": EditRelatedAssetWidget,
};

function getWidgetComponentByType(type: string) {
  return widgetMap[type] || "div";
}
</script>
<style scoped></style>
