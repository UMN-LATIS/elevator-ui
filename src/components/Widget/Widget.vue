<template>
  <Tuple :label="widget.label">
    <component
      :is="getWidgetComponentByType(widget.type)"
      v-if="getWidgetComponentByType(widget.type)"
      :widget="widget"
      :contents="widgetContents"
      :asset="asset"
    >
    </component>
  </Tuple>
</template>
<script setup lang="ts">
import { type Component, computed, defineAsyncComponent } from "vue";
import { Asset, WidgetProps, WidgetType } from "@/types";
import { getWidgetContents } from "@/helpers/displayUtils";
import Tuple from "@/components/Tuple/Tuple.vue";

const SelectWidget = defineAsyncComponent(
  () => import("@/components/Widget/SelectWidget/SelectWidget.vue")
);
const CheckBoxWidget = defineAsyncComponent(
  () => import("@/components/Widget/CheckBoxWidget/CheckBoxWidget.vue")
);
const TextAreaWidget = defineAsyncComponent(
  () => import("@/components/Widget/TextAreaWidget/TextAreaWidget.vue")
);
const DateWidget = defineAsyncComponent(
  () => import("@/components/Widget/DateWidget/DateWidget.vue")
);
const MultiSelectWidget = defineAsyncComponent(
  () => import("@/components/Widget/MultiSelectWidget/MultiSelectWidget.vue")
);
const LocationWidget = defineAsyncComponent(
  () => import("@/components/Widget/LocationWidget/LocationWidget.vue")
);
const UploadWidget = defineAsyncComponent(
  () => import("@/components/Widget/UploadWidget/UploadWidget.vue")
);
const TagWidget = defineAsyncComponent(
  () => import("@/components/Widget/TagWidget/TagWidget.vue")
);
const RelatedAssetWidget = defineAsyncComponent(
  () => import("@/components/Widget/RelatedAssetWidget/RelatedAssetWidget.vue")
);

// async components
const TextWidget = defineAsyncComponent(
  () => import("@/components/Widget/TextWidget/TextWidget.vue")
);

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
