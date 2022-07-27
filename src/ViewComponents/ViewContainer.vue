<template>
    <div v-if="template">

        <template v-for="widget in sortedWidgetArray" :key="widget.id">
            <div class="assetWidget">
                <component v-if="widget.display && getType(widget.type) && asset[widget.fieldTitle]"
                    :is="components[getType(widget.type)]" :widget="widget" :contents="asset[widget.fieldTitle]"
                    :asset="asset">
                </component>
            </div>
        </template>


    </div>

</template>


<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import TextWidget from "./TextWidget/TextWidget.vue";
import TextAreaWidget from "./TextAreaWidget/TextAreaWidget.vue";
import CheckBoxWidget from "./CheckBoxWidget/CheckBoxWidget.vue";
import SelectWidget from "./SelectWidget/SelectWidget.vue";
import DateWidget from "./DateWidget/DateWidget.vue";
import MultiSelectWidget from "./MultiSelectWidget/MultiSelectWidget.vue";
import LocationWidget from "./LocationWidget/LocationWidget.vue";
import UploadWidget from "./UploadWidget/UploadWidget.vue";
import RelatedAssetWidget from "./RelatedAssetWidget/RelatedAssetWidget.vue";
import { useAssetStore } from "@/stores/assetStore";
import { useTemplateStore } from "@/stores/templateStore";

import { Widget } from "@/types";
import { getAsset } from "@/Helpers/displayUtils";

const store = useAssetStore();
const templateStore = useTemplateStore();
const components = {
    TextWidget,
    SelectWidget,
    CheckBoxWidget,
    TextAreaWidget,
    DateWidget,
    MultiSelectWidget,
    LocationWidget,
    UploadWidget,
    RelatedAssetWidget
};

const asset: any = ref(null);
const template: any = ref(null);

interface Props {
    objectId: string;
    isPrimaryElement: boolean;
}

const widgetMap = {
    "text": "TextWidget",
    "select": "SelectWidget",
    "checkbox": "CheckBoxWidget",
    "text area": "TextAreaWidget",
    "date": "DateWidget",
    "multiselect": "MultiSelectWidget",
    "location": "LocationWidget",
    "upload": "UploadWidget",
    "related asset": "RelatedAssetWidget"
}

const props = defineProps<Props>();

function getType(widgetType) {
    return widgetMap[widgetType] ?? false
}


const sortedWidgetArray = computed((): Widget[] => {
    const sortedArray = template.value.widgetArray.sort((a, b) => {
        return a.viewOrder - b.viewOrder;
    });
    return sortedArray;
});



onMounted(async () => {
    asset.value = await getAsset(props.objectId);
    if (asset && asset.value && asset.value.templateId) {
        template.value = await templateStore.loadTemplate(asset.value.templateId);
        if (props.isPrimaryElement && asset.value.firstFileHandlerId) {

            store.fileObjectId = asset.value.firstFileHandlerId;
            store.objectId = asset.value.firstObjectId;
        }

    }
});

</script>
