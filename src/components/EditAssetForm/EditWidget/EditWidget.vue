<template>
  <component
    :is="getWidgetComponentByType(widgetDef.type)"
    :widgetDef="widgetDef"
    :widgetContents="widgetContents"
    @update:widgetContents="$emit('update:widgetContents', $event)" />
</template>
<script setup lang="ts">
import { type Component } from "vue";
import type { WidgetProps, WidgetContent } from "@/types";
import { WidgetType } from "@/types";
import EditSelectWidget from "./EditSelectWidget.vue";
import EditCheckboxWidget from "./EditCheckboxWidget.vue";
import EditTextAreaWidget from "./EditTextAreaWidget.vue";
import EditDateWidget from "./EditDateWidget.vue";
import EditMultiSelectWidget from "./EditMultiSelectWidget.vue";
import EditLocationWidget from "./EditLocationWidget.vue";
import EditUploadWidget from "./EditUploadWidget.vue";
import EditTagWidget from "./EditTagWidget.vue";
import EditRelatedAssetWidget from "./EditRelatedAssetWidget.vue";
import EditTextWidget from "./EditTextWidget.vue";

defineProps<{
  widgetDef: WidgetProps;
  widgetContents: WidgetContent[];
}>();

defineEmits<{
  (e: "update:widgetContents", widgetContents: WidgetContent[]): void;
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
  return widgetMap[type] || null;
}
</script>
<style scoped></style>
