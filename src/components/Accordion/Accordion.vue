<template>
  <div
    class="accordion overflow-hidden bg-neutral-50 w-full mt-2 rounded border"
  >
    <button
      class="accordion__header flex w-full justify-between items-center p-4 gap-2 bg-white border-none rounded-b-none"
      :label="isOpen ? 'close' : 'open'"
      :icon="isOpen ? 'expand_less' : 'expand_more'"
      @click="handleAccordionToggle"
    >
      <slot name="label">
        <span class="flex-1 block text-left font-normal">{{ label }}</span>
      </slot>
      <div class="flex place-items-center">
        <slot name="label-icon">
          <ChevronUpIcon v-if="isOpen" />
          <ChevronDownIcon v-else />
        </slot>
      </div>
    </button>
    <div
      v-if="isOpen"
      class="accordion__panel p-4 pt-6 flex flex-col gap-6 border-t"
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
<style scoped></style>
