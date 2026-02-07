<template>
  <div class="text-area-item">
    <div
      ref="containerRef"
      class="prose"
      :class="{
        'overflow-hidden': !isExpanded,
      }"
      :style="{
        'max-height': !isExpanded ? `${truncateHeight}px` : 'none',
      }"
      v-html="fieldContents" />

    <button
      v-if="isTruncateable"
      class="flex items-center uppercase text-xs text-primary"
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
import config from "@/config";

defineProps<{
  fieldContents: string;
  widget: WidgetDef;
}>();

const isExpanded = ref(false);
const containerRef = useTemplateRef("containerRef");
const isTruncateable = ref(false);
const truncateHeight = config.instance.textAreaItem.defaultTextTruncationHeight;

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

  /* this is a workaround for quill saving bulleted lists as
   * ordered lists (e.g. `<ol><li data-list="bullet">`)
   * this should now be fixed in the EditTextAreaWidget.vue but
   * adding this style workaround in case */
  & li[data-list="bullet"] {
    list-style-type: disc;
  }
}
</style>
