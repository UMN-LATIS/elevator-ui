<template>
    <div v-html="fieldContents" ref="truncateText" :id="elementId"> </div>
    <a href="#" @click.prevent="show = !show" v-if="isTruncated">Show More</a>
    <div v-if="show" v-html="fieldContents">
    </div>
</template>
    
<script setup lang="ts">
import { Widget } from "@/types";
import { computed, ref, onMounted, onUnmounted, nextTick } from "vue";
import shave from 'shave';

interface Props {
    fieldContents: string;
    widget: Widget;
}
const props = defineProps<Props>();
const show = ref(false);
const truncateText = ref(HTMLDivElement);
const isTruncated = ref(false);
const elementId = "f" + Math.floor(Math.random() * 100000000000).toString(36);


onMounted(() => {
    // some sorta race condition means sometimes the element can't be fetched with a querySelector
    // during onMounted, need to wait for nextTick
    nextTick(() => updateShave());
    window.addEventListener('resize', () => {
        updateShave();
    });
});
onUnmounted(() => {
    window.removeEventListener('resize', () => {
        updateShave();
    });
});

function updateShave() {
    let shaveLength = 100;
    if (window.textTruncationLength !== undefined) {
        shaveLength = window.textTruncationLength;
    }
    const selector = `#${elementId}`;
    shave(selector, shaveLength);
    isTruncated.value = document.querySelector(`${selector} .js-shave-char`) !== null;
}

</script>
