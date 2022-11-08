<template>
  <div class="accordion overflow-hidden w-full mt-2 rounded">
    <button
      class="accordion__header flex w-full justify-between items-center p-4 gap-2 border-none rounded-b-none"
      :label="isOpen ? 'close' : 'open'"
      @click="handleAccordionToggle"
    >
      <slot name="label">
        <span
          class="flex-1 block text-left"
          :class="{
            'font-bold ': isOpen,
            'font-normal': !isOpen,
          }"
          >{{ label }}</span
        >
      </slot>
      <div class="flex place-items-center">
        <slot name="label-icon">
          <ChevronUpIcon v-if="isOpen" class="w-5 h-5" />
          <ChevronDownIcon v-else class="w-5 h-5" />
        </slot>
      </div>
    </button>
    <div
      v-if="isOpen"
      class="accordion__body px-4 pt-2 pb-4 flex flex-col gap-4 border-t"
    >
      <slot />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import ChevronDownIcon from "@/icons/ChevronDownIcon.vue";
import ChevronUpIcon from "@/icons/ChevronUpIcon.vue";

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
