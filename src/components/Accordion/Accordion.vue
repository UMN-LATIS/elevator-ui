<template>
  <div class="accordion w-full mt-2 overflow-hidden rounded">
    <button
      class="accordion__header flex items-center justify-between w-full gap-2 border-none rounded-b-none"
      :label="isOpen ? 'close' : 'open'"
      @click="handleAccordionToggle">
      <slot name="label">
        <span
          class="flex-1 block p-4 text-left"
          :class="{
            'font-bold ': isOpen,
            'font-normal': !isOpen,
          }">
          {{ convertHtmlToText(label) }}
        </span>
      </slot>
      <div class="place-items-center flex p-4">
        <slot name="label-icon">
          <ChevronUpIcon v-if="isOpen" class="w-5 h-5" />
          <ChevronDownIcon v-else class="w-5 h-5" />
        </slot>
      </div>
    </button>
    <div
      v-if="isOpen"
      class="accordion__body flex flex-col gap-4 px-4 pt-2 pb-4 border-t">
      <slot />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import ChevronDownIcon from "@/icons/ChevronDownIcon.vue";
import ChevronUpIcon from "@/icons/ChevronUpIcon.vue";
import { convertHtmlToText } from "@/helpers/displayUtils";

withDefaults(
  defineProps<{
    label?: string;
  }>(),
  {
    label: "-",
  }
);

const emit = defineEmits<{
  (eventName: "toggle");
  (eventName: "open");
}>();

const isOpen = ref(false);

function handleAccordionToggle() {
  isOpen.value = !isOpen.value;
  emit("toggle");
  if (isOpen.value) emit("open");
}
</script>
<style scoped>
.accordion {
  color: var(--app-accordion-textColor);
  border: var(--app-accordion-outer-borderWidth) solid
    var(--app-accordion-outer-borderColor);
}
.accordion__header {
  background: var(--app-accordion-header-backgroundColor);
  color: var(--app-accordion-header-textColor);
}

.accordion__body {
  background: var(--app-accordion-body-backgroundColor);
  color: var(--app-accordion-body-textColor);
  border-top: var(--app-accordion-inner-borderWidth) solid
    var(--app-accordion-inner-borderColor);
}
</style>
