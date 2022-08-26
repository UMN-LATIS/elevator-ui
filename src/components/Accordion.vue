<template>
  <div
    class="accordion rounded-md overflow-hidden border border-neutral-300 bg-neutral-50 w-full mt-2"
  >
    <Button
      class="accordion__header flex w-full justify-start items-center p-4 gap-2 bg-neutral-200 border-none rounded-b-none"
      label="expand more"
      icon="expand_more"
      @click="isOpen = !isOpen"
    >
      <span class="flex-1 block text-left font-normal">{{ label }}</span>
    </Button>
    <div
      v-if="isOpen"
      class="accordion__panel p-4 pt-6 border-t border-neutral-300 flex flex-col gap-6 bg-white"
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
