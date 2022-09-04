<template>
  <div class="accordion overflow-hidden bg-neutral-50 w-full mt-2 shadow-sm">
    <Button
      class="accordion__header flex w-full justify-start items-center p-4 gap-2 bg-neutral-100 border-none rounded-b-none"
      :label="isOpen ? 'close' : 'open'"
      :icon="isOpen ? 'expand_less' : 'expand_more'"
      @click="handleAccordionToggle"
    >
      <span class="flex-1 block text-left font-normal">{{ label }}</span>
    </Button>
    <div
      v-if="isOpen"
      class="accordion__panel p-4 pt-6 flex flex-col gap-6 bg-white"
    >
      <slot />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import Button from "@/components/Button/Button.vue";
withDefaults(
  defineProps<{
    label: string;
  }>(),
  {
    label: "-",
  }
);

const emit = defineEmits<{
  (eventName: "toggle");
}>();

const isOpen = ref(false);

function handleAccordionToggle() {
  isOpen.value = !isOpen.value;
  emit("toggle");
}
</script>
<style scoped></style>
