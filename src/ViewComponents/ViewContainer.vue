<template>
    <div>
        <template v-for="widget in sortedWidgetArray" :key="widget.id">
            <div class="assetWidget">
                <component v-if="widget.display && getType(widget.type)" :is="components[getType(widget.type)]"
                    :widget="widget" :contents="asset[widget.fieldTitle]">
                </component>
            </div>
        </template>


    </div>

</template>


<script setup lang="ts">
import { computed } from "vue";
import TextWidget from "./TextWidget/TextWidget.vue";
import TextAreaWidget from "./TextAreaWidget/TextAreaWidget.vue";
import CheckBoxWidget from "./CheckBoxWidget/CheckBoxWidget.vue";
import SelectWidget from "./SelectWidget/SelectWidget.vue";
import DateWidget from "./DateWidget/DateWidget.vue";
import MultiSelectWidget from "./MultiSelectWidget/MultiSelectWidget.vue";

import { Widget } from "@/types";

const components = {
    TextWidget,
    SelectWidget,
    CheckBoxWidget,
    TextAreaWidget,
    DateWidget,
    MultiSelectWidget
};

interface Props {
    asset: any;
    template: any;
}

const widgetMap = {
    "text": "TextWidget",
    "select": "SelectWidget",
    "checkbox": "CheckBoxWidget",
    "text area": "TextAreaWidget",
    "date": "DateWidget",
    "multiselect": "MultiSelectWidget"
}

const props = defineProps<Props>();

function getType(widgetType) {
    return widgetMap[widgetType] ?? false
}


const sortedWidgetArray = computed((): Widget[] => {
    const sortedArray = props.template.widgetArray.sort((a, b) => {
        return a.viewOrder - b.viewOrder;
    });
    return sortedArray;
});

</script>
