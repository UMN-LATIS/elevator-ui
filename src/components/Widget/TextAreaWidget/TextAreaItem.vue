<template>
  <div v-if="!show" ref="truncateText" v-html="fieldContents"></div>
  <div v-if="show" v-html="fieldContents"></div>

  <button
    class="flex items-center uppercase text-xs text-blue-600"
    @click="show = !show"
  >
    Show {{ show ? "Less" : "More" }}
    <ChevronUpIcon v-if="show" />
    <ChevronDownIcon v-else />
  </button>
</template>
<script setup lang="ts">
import { WidgetProps } from "@/types";
import { ref, onMounted } from "vue";
import { useResizeObserver, useDebounceFn } from "@vueuse/core";
import shave from "shave";
import ChevronDownIcon from "@/icons/ChevronDownIcon.vue";
import ChevronUpIcon from "@/icons/ChevronUpIcon.vue";

const props = withDefaults(
  defineProps<{
    fieldContents: string;
    widget: WidgetProps;
    textTruncationLength?: number;
  }>(),
  {
    textTruncationLength: 75,
  }
);
const show = ref(false);
const truncateText = ref<HTMLDivElement | null>(null);
const isTruncated = ref(false);

const debouncedShave = useDebounceFn(() => {
  updateShave();
}, 50);

function updateShave() {
  if (!truncateText.value) {
    return;
  }

  shave(
    [truncateText.value] as unknown as NodeList,
    props.textTruncationLength
  );
  isTruncated.value =
    truncateText.value.querySelector<HTMLElement>(".js-shave") !== null;
}

useResizeObserver(truncateText, debouncedShave);
onMounted(() => {
  updateShave();
});
</script>
