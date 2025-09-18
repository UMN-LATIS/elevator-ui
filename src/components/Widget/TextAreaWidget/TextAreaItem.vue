<template>
  <div class="text-area-item">
    <div
      ref="containerRef"
      class="prose"
      :class="{
        'line-clamp-3 max-h-[5rem] overflow-hidden': !isExpanded,
      }"
      v-html="fieldContents" />

    <button
      v-if="isTruncateable"
      class="flex items-center uppercase text-xs text-blue-600"
      @click="isExpanded = !isExpanded">
      {{ isExpanded ? "Show Less" : "Show More" }}
      <ChevronUpIcon v-if="isExpanded" />
      <ChevronDownIcon v-else />
    </button>
  </div>
</template>
<script setup lang="ts">
import { WidgetDef } from "@/types";
import { ref, onMounted, useTemplateRef } from "vue";
import ChevronDownIcon from "@/icons/ChevronDownIcon.vue";
import ChevronUpIcon from "@/icons/ChevronUpIcon.vue";
import invariant from "tiny-invariant";

defineProps<{
  fieldContents: string;
  widget: WidgetDef;
}>();

const isExpanded = ref(false);
const containerRef = useTemplateRef("containerRef");
const isTruncateable = ref(false);

function doesContentOverflow(el: HTMLElement | null = null) {
  return el ? el.scrollHeight > el.clientHeight : false;
}

onMounted(() => {
  invariant(containerRef.value);
  isTruncateable.value = doesContentOverflow(containerRef.value);
});
</script>
<style>
.text-area-item .prose {
  line-height: 1.4;

  & li[data-list="bullet"] {
    list-style-type: disc;
  }
}
</style>
