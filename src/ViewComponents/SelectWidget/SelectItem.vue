<template>
    <li v-for="(content, key) in contentAsArray" :key="key">
        <Link :widget="widget" :linkText="getDisplayText(content)" v-html="getDisplayText(content)">

        </Link>
    </li>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Link from "@/Helpers/Link/Link.vue";
import { Widget } from "@/types";
import { WidgetContents } from "@/types";

interface Props {
    selectValues: WidgetContents;
    widget: Widget;
}

const props = defineProps<Props>();

const contentAsArray = computed(() => {
    if (typeof props.selectValues.fieldContents === "string") {
        return [
            props.selectValues.fieldContents
        ];
    }
    else {
        return props.selectValues.fieldContents;
    }
});

function getDisplayText(content: string): string {
    if (props.widget.fieldData.selectGroup.hasOwnProperty(content)) {
        return props.widget.fieldData.selectGroup[content];
    }
    else {
        return content;
    }

}

</script>
