<template>
    <div v-html="fieldContents" ref="truncateText"> </div>
    <a href="#" @click.prevent="show = !show" v-if="isTruncated">Show More</a>
    <div v-if="show" v-html="fieldContents">
    </div>
</template>
    
<script setup lang="ts">
import { Widget } from "@/types";
import { computed, ref, onMounted, onUnmounted, nextTick } from "vue";
import { useResizeObserver, useDebounceFn } from "@vueuse/core";
import shave from 'shave';

interface Props {
    fieldContents: string;
    widget: Widget;
}
const props = defineProps<Props>();
const show = ref(false);
const truncateText = ref<HTMLDivElement | null>(null);
const isTruncated = ref(false);


const debouncedShave = useDebounceFn(() => {
    updateShave()
}, 50)

function updateShave() {
    if (!truncateText.value) {
        return;
    }
    let shaveLength = 100;
    if (window.textTruncationLength !== undefined) {
        shaveLength = window.textTruncationLength;
    }

    shave([truncateText.value] as unknown as NodeList, shaveLength);
    isTruncated.value = truncateText.value.querySelector<HTMLElement>(".js-shave") !== null
}

useResizeObserver(truncateText, debouncedShave);
onMounted(() => {
    updateShave();
});


</script>
