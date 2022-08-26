<template>
  <div
    class="accordion rounded-md overflow-hidden bg-neutral-100 border w-full mt-2"
  >
    <Button
      class="accordion__header flex w-full justify-start items-center p-4 gap-2 flex-row-reverse bg-neutral-200 border-none rounded-b-none"
      label="expand more"
      icon="expand_more"
      @click="isOpen = !isOpen"
    >
      <span class="flex-1 block text-left font-normal">{{ label }}</span>
    </Button>
    <div
      v-if="isOpen"
      class="accordion__panel px-10 py-8 border-t border-neutral-300 flex flex-col gap-6 pt-6"
    >
      <slot />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import Button from "./Button.vue";
withDefaults(
  defineProps<{
    label: string;
  }>(),
  {
    label: "-",
  }
);

const isOpen = ref(false);
</script>
<style scoped></style>
