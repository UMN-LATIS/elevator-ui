<!-- todo need to fix all the hover state stuff, decide if that matters-->
<template>
  <Tuple v-if="!shouldSuppress" :label="widget.label">
    <component
      :is="components[getType(widget.type)]"
      v-if="getType(widget.type)"
      :widget="widget"
      :contents="contents"
      :asset="asset"
    >
    </component>
  </Tuple>
</template>

<script setup lang="ts">
import { Asset, Widget, WidgetContents, WidgetType } from "@/types";
import TextWidget from "./TextWidget/TextWidget.vue";
import TextAreaWidget from "./TextAreaWidget/TextAreaWidget.vue";
import CheckBoxWidget from "./CheckBoxWidget/CheckBoxWidget.vue";
import SelectWidget from "./SelectWidget/SelectWidget.vue";
import DateWidget from "./DateWidget/DateWidget.vue";
import MultiSelectWidget from "./MultiSelectWidget/MultiSelectWidget.vue";
import LocationWidget from "./LocationWidget/LocationWidget.vue";
import UploadWidget from "./UploadWidget/UploadWidget.vue";
import RelatedAssetWidget from "./RelatedAssetWidget/RelatedAssetWidget.vue";
import TagWidget from "./TagWidget/TagWidget.vue";
import { getTitleWidget } from "@/Helpers/displayUtils";
import { onMounted, ref } from "vue";
import Tuple from "@/components/Tuple.vue";

interface Props {
  widget: Widget;
  contents: WidgetContents[];
  asset: Asset;
}

const props = defineProps<Props>();

const components = {
  TextWidget,
  SelectWidget,
  CheckBoxWidget,
  TextAreaWidget,
  DateWidget,
  MultiSelectWidget,
  LocationWidget,
  UploadWidget,
  RelatedAssetWidget,
  TagWidget,
};
const widgetMap = {
  text: "TextWidget",
  select: "SelectWidget",
  checkbox: "CheckBoxWidget",
  "text area": "TextAreaWidget",
  date: "DateWidget",
  multiselect: "MultiSelectWidget",
  location: "LocationWidget",
  upload: "UploadWidget",
  "related asset": "RelatedAssetWidget",
  "tag list": "TagWidget",
};

const shouldSuppress = ref(false);

onMounted(async () => {
  await calculateShouldSuppressTitle();
});

// If the title is the same as this element and wouldn't look different, we don't draw it.
async function calculateShouldSuppressTitle() {
  const titleWidget = await getTitleWidget(props.asset);

  if (
    props.widget.fieldTitle == titleWidget.fieldTitle &&
    props.widget.type === WidgetType[WidgetType.text] &&
    props.contents.length == 1
  ) {
    shouldSuppress.value = true;
  } else {
    shouldSuppress.value = false;
  }
}

function getType(widgetType) {
  return widgetMap[widgetType] ?? false;
}
</script>
