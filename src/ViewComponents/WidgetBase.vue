<!-- todo need to fix all the hover state stuff, decide if that matters-->
<template>
    <label>
        <div>{{ widget.label }}</div>
        <component v-if="getType(widget.type)" :is="components[getType(widget.type)]" :widget="widget"
            :contents="contents" :asset="asset">
        </component>
    </label>
</template>

<script setup lang="ts">
import { Widget, WidgetContents } from "@/types";
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


interface Props {
    widget: Widget;
    contents: WidgetContents[];
    asset: any;
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
    TagWidget
};
const widgetMap = {
    "text": "TextWidget",
    "select": "SelectWidget",
    "checkbox": "CheckBoxWidget",
    "text area": "TextAreaWidget",
    "date": "DateWidget",
    "multiselect": "MultiSelectWidget",
    "location": "LocationWidget",
    "upload": "UploadWidget",
    "related asset": "RelatedAssetWidget",
    "tag list": "TagWidget"
}

function getType(widgetType) {
    return widgetMap[widgetType] ?? false
}

</script>

<style scoped>
label div {
    font-weight: bold;
    font-size: 1.1em;
    margin-bottom: 0.4em;
    color: gray;
    font-family: "Roboto", sans-serif;
}
</style>