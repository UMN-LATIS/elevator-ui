<template>
  <div ref="editWidgetRef" class="edit-widget">
    <component
      :is="getWidgetComponentByType(widgetDef.type)"
      :widgetDef="widgetDef"
      :widgetContents="widgetContents"
      :assetId="assetId"
      :isOpen="isOpen"
      @update:isOpen="$emit('update:isOpen', $event)"
      @update:widgetContents="$emit('update:widgetContents', $event)" />
  </div>
</template>
<script setup lang="ts">
import { type Component, ref, watch } from "vue";
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
import { useFocusWithin } from "@vueuse/core";

defineProps<{
  widgetDef: WidgetProps;
  widgetContents: WidgetContent[];
  assetId: string | null; // new assets may have a null id
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "update:widgetContents", widgetContents: WidgetContent[]): void;
  (e: "update:isOpen", isOpen: boolean): void;
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

const editWidgetRef = ref<HTMLElement | null>(null);

const { focused } = useFocusWithin(editWidgetRef);

watch(
  focused,
  (isFocused) => {
    if (isFocused) {
      emit("update:isOpen", true);
    }
  },
  { immediate: true }
);
</script>
<style scoped></style>
