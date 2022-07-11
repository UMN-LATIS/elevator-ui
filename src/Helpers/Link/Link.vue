<template>
    <span v-if="props.widget.clickToSearch">
        <a :href="linkURL">{{ linkText }}</a>
    </span>
    <span v-else>
        {{ linkText }}
    </span>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
import { ref, computed } from "vue";
import { Widget } from "@/types";
import { getBaseURL } from "@/Helpers/displayUtils";

interface Props {
    widget: Widget;
    linkText: string;
    displayText?: string;
}

const props = defineProps<Props>();

const linkURL = computed(() => {
    let cleanedLinkText = props.linkText.trim().replace("?", "").replace("...", "");
    if (props.widget.clickToSearchType == 0) {
        return getBaseURL() + "search/querySearch/" + encodeURIComponent(cleanedLinkText);
    }
    else {
        return getBaseURL() + "search/scopedQuerySearch/" + props.widget.fieldTitle + "/" + encodeURIComponent(cleanedLinkText);
    }
});

const linkText = computed(() => {
    let presentationText = props.linkText;
    if (props.displayText) {
        presentationText = props.displayText;
    }
    return presentationText.trim();
})

</script>
