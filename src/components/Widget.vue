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
import { computed } from "vue";
import type { Asset, Widget, WidgetContents } from "@/types";
import { WidgetType } from "@/types";
import Tuple from "@/components/Tuple.vue";
import TextWidget from "@/ViewComponents/TextWidget/TextWidget.vue";
import SelectWidget from "@/ViewComponents/SelectWidget/SelectWidget.vue";
import CheckBoxWidget from "@/ViewComponents/CheckBoxWidget/CheckBoxWidget.vue";
import TextAreaWidget from "@/ViewComponents/TextAreaWidget/TextAreaWidget.vue";
import DateWidget from "@/ViewComponents/DateWidget/DateWidget.vue";
import MultiSelectWidget from "@/ViewComponents/MultiSelectWidget/MultiSelectWidget.vue";
import LocationWidget from "@/ViewComponents/LocationWidget/LocationWidget.vue";
import UploadWidget from "@/ViewComponents/UploadWidget/UploadWidget.vue";
import TagWidget from "@/ViewComponents/TagWidget/TagWidget.vue";
import RelatedAssetWidget from "@/ViewComponents/RelatedAssetWidget/RelatedAssetWidget.vue";
import { getWidgetContents } from "@/Helpers/displayUtils";
// import { useTemplateStore } from "@/stores/newTemplateStore";

const props = defineProps<{
  widget: Widget;
  asset: Asset;
  // template: Template;
}>();

const widgetContents = computed(() =>
  getWidgetContents({ asset: props.asset, widget: props.widget })
);

// map widgetTypeToComponent
const widgetMap = {
  [WidgetType.Text]: TextWidget,
  [WidgetType.Select]: SelectWidget,
  [WidgetType.Checkbox]: CheckBoxWidget,
  [WidgetType.TextArea]: TextAreaWidget,
  [WidgetType.Date]: DateWidget,
  [WidgetType.MultiSelect]: MultiSelectWidget,
  [WidgetType.Location]: LocationWidget,
  [WidgetType.Upload]: UploadWidget,
  [WidgetType.TagList]: TagWidget,
  [WidgetType.RelatedAsset]: RelatedAssetWidget,
};

function getWidgetComponentByType(type: string) {
  return widgetMap[type] || null;
}
</script>
<style scoped></style>
