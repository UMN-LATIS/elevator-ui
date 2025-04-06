<template>
  <component
    :is="getWidgetComponentByType(widget.type)"
    :widget="widget"
    :contents="widgetContents"
    :asset="asset" />
</template>
<script setup lang="ts">
import { type Component, computed } from "vue";
import type { Asset, TemplateWidgetProps } from "@/types";
import { WidgetType } from "@/types";
import SelectWidget from "@/components/Widget/SelectWidget/SelectWidget.vue";
import CheckBoxWidget from "@/components/Widget/CheckBoxWidget/CheckBoxWidget.vue";
import TextAreaWidget from "@/components/Widget/TextAreaWidget/TextAreaWidget.vue";
import DateWidget from "@/components/Widget/DateWidget/DateWidget.vue";
import MultiSelectWidget from "@/components/Widget/MultiSelectWidget/MultiSelectWidget.vue";
import LocationWidget from "@/components/Widget/LocationWidget/LocationWidget.vue";
import UploadWidget from "@/components/Widget/UploadWidget/UploadWidget.vue";
import TagWidget from "@/components/Widget/TagWidget/TagWidget.vue";
import RelatedAssetWidget from "@/components/Widget/RelatedAssetWidget/RelatedAssetWidget.vue";
import { getWidgetContents } from "@/helpers/displayUtils";
import EditTextWidget from "./EditTextWidget.vue";

const props = defineProps<{
  widget: TemplateWidgetProps;
  asset: Asset;
}>();

const widgetContents = computed(() =>
  getWidgetContents({ asset: props.asset, widget: props.widget })
);

// map widgetTypeToComponent
const widgetMap: Record<WidgetType, Component> = {
  text: EditTextWidget,
  select: SelectWidget,
  checkbox: CheckBoxWidget,
  "text area": TextAreaWidget,
  date: DateWidget,
  multiselect: MultiSelectWidget,
  location: LocationWidget,
  upload: UploadWidget,
  "tag list": TagWidget,
  "related asset": RelatedAssetWidget,
};

function getWidgetComponentByType(type: string) {
  return widgetMap[type] || null;
}
</script>
<style scoped></style>
