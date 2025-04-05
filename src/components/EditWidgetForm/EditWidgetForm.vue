<template>
  <component
    :is="getWidgetComponentByType(widget.type)"
    v-if="['upload'].includes(widget.type)"
    :widget="widget"
    :contents="widgetContents"
    :asset="asset"></component>
  <Tuple v-else :label="widget.label" class="widget">
    <component
      :is="getWidgetComponentByType(widget.type)"
      v-if="getWidgetComponentByType(widget.type)"
      :widget="widget"
      :contents="widgetContents"
      :asset="asset"></component>
  </Tuple>
</template>
<script setup lang="ts">
import { type Component, computed } from "vue";
import type { Asset, WidgetProps } from "@/types";
import { WidgetType } from "@/types";
import Tuple from "@/components/Tuple/Tuple.vue";
import TextWidget from "@/components/Widget/TextWidget/TextWidget.vue";
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

const props = defineProps<{
  widget: WidgetProps;
  asset: Asset;
}>();

const widgetContents = computed(() =>
  getWidgetContents({ asset: props.asset, widget: props.widget })
);

// map widgetTypeToComponent
const widgetMap: Record<WidgetType, Component> = {
  text: TextWidget,
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
