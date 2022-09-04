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
import { type Component, computed } from "vue";
import type { Asset, WidgetProps } from "@/types";
import { WidgetType } from "@/types";
import Tuple from "@/components/Tuple.vue";
import TextWidget from "@/components/widgets/TextWidget/TextWidget.vue";
import SelectWidget from "@/components/widgets/SelectWidget/SelectWidget.vue";
import CheckBoxWidget from "@/components/widgets/CheckBoxWidget/CheckBoxWidget.vue";
import TextAreaWidget from "@/components/widgets/TextAreaWidget/TextAreaWidget.vue";
import DateWidget from "@/components/widgets/DateWidget/DateWidget.vue";
import MultiSelectWidget from "@/components/widgets/MultiSelectWidget/MultiSelectWidget.vue";
import LocationWidget from "@/components/widgets/LocationWidget/LocationWidget.vue";
import UploadWidget from "@/components/widgets/UploadWidget/UploadWidget.vue";
import TagWidget from "@/components/widgets/TagWidget/TagWidget.vue";
// import RelatedAssetWidget from "@/components/widgets/RelatedAssetWidget/RelatedAssetWidget.vue";
import RelatedAssetWidget from "@/components/widgets/RelatedAssetWidget/RelatedAssetWidget.vue";
import { getWidgetContents } from "@/Helpers/displayUtils";

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
