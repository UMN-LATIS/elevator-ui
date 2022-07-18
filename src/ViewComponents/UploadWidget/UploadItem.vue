<template>
    <img :src="thumbURL" :alt="content.fileDescription" />
</template>

<script setup lang="ts">
import { Widget, WidgetContents } from "@/types";
import { getBaseURL } from "@/Helpers/displayUtils";
import { computed } from "vue";

interface FileContents {
    "loc": object;
    "fileId": string;
    "fileType": string;
    "sidecars": object;
    "isPrimary": boolean;
    "searchData": string;
    "fileDescription": string;
}

interface Props {
    widget: Widget;
    content: FileContents;
}
const props = defineProps<Props>();

const thumbURL = computed(() => {
    return getBaseURL() + "fileManager/getDerivativeById/" + props.content.fileId + "/tiny2x";
})

</script>
