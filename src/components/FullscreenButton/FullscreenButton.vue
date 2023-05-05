<template>
  <button
    class="inline-flex gap-1 p-2 md:px-4 items-center justify-center rounded-md text-xs uppercase tracking-wide whitespace-nowrap group transition-all"
    :class="{
      ' text-neutral-900 bg-transparent-black-100 hover:bg-blue-600 hover:text-blue-100':
        !isFullscreen,
      'bg-transparent-white-300 text-neutral-500 hover:bg-blue-600 hover:text-blue-100':
        isFullscreen,
    }"
    @click="$emit('click', $event)"
  >
    <FullscreenIcon
      v-if="!isFullscreen"
      class="fill-neutral-900 group-hover:fill-neutral-200 transition-all"
    />
    <ExitFullscreenIcon
      v-else
      class="fill-neutral-500 group-hover:fill-neutral-100 transition-all"
    />
    <span class="sr-only">Toggle fullscreen</span>
    <span class="not-sr-only hidden md:inline-block"
      >{{ isFullscreen ? "Exit" : "" }} Fullscreen</span
    >
  </button>
</template>
<script setup lang="ts">
import { FullscreenIcon, ExitFullscreenIcon } from "@/icons";

defineProps<{
  isFullscreen: boolean;
}>();

defineEmits<{
  (eventName: "click", event: Event): void;
}>();
</script>
<style scoped></style>
