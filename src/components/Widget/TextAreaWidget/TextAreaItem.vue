<template>
  <div v-if="!show" ref="truncateText" v-html="fieldContents"></div>

  <div v-if="show" v-html="fieldContents"></div>
  <Button
    :icon="show ? 'expand_less' : 'expand_more'"
    variant="tertiary"
    @click="show = !show"
  >
    Show {{ show ? "Less" : "More" }}
  </Button>
</template>

<script setup lang="ts">
import { WidgetProps } from "@/types";
import { ref, onMounted } from "vue";
import { useResizeObserver, useDebounceFn } from "@vueuse/core";
import shave from "shave";
import Button from "@/components/Button/Button.vue";

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
