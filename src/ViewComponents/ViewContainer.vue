<template>
    <div>
        <template v-for="widget in template.widgetArray" :key="widget.id">
            <div class="assetWidget">
                <component v-if="widget.display && getType(widget.type)" :is="components[getType(widget.type)]"
                    :widget="widget" :contents="asset[widget.fieldTitle]">
                </component>
            </div>
        </template>


    </div>

</template>


<script setup lang="ts">
import TextWidget from "./TextWidget/TextWidget.vue";
import SelectWidget from "./SelectWidget/SelectWidget.vue";

const components = {
    TextWidget,
    SelectWidget
};

interface Props {
    asset: any;
    template: any;
}

const widgetMap = {
    "text": "TextWidget",
    "select": "SelectWidget"
}

const props = defineProps<Props>();

function getType(widgetType) {
    return widgetMap[widgetType] ?? false
}

</script>
