<template>
  <div class="more-menu relative">
    <Button
      label="open more options menu"
      icon="more_vert"
      class="inline-flex items-center text-center p-1 text-neutral-400 rounded-full"
      :class="{
        'bg-neutral-200 text-neutral-800 hover:!text-neutral-800': isOpen,
      }"
      @click="isOpen = !isOpen" />

    <!-- Dropdown menu -->
    <div
      id="dropdownDots"
      class="absolute bottom-full mb-2 -right-2 z-10 w-44 rounded-lg bg-transparent-black-800 backdrop-blur flex flex-col gap-2 p-4 text-xs"
      :class="{
        'top-full mt-2': openDirection === 'down',
        hidden: !isOpen,
      }">
      <slot>More options</slot>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import Button from "@/components/Button/Button.vue";
withDefaults(
  defineProps<{
    openDirection?: "up" | "down";
  }>(),
  {
    openDirection: "up",
  }
);

const isOpen = ref(false);
</script>
<style scoped></style>
