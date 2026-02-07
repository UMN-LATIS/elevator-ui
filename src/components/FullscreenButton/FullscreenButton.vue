<template>
  <button
    class="fullscreen-button inline-flex gap-1 p-2 md:px-4 items-center justify-center rounded-md text-xs uppercase tracking-wide whitespace-nowrap group transition-all"
    :class="{
      ' text-on-surface bg-outline hover:bg-m3-primary hover:text-on-primary':
        !isFullscreen,
      'bg-surface-container text-on-surface-variant hover:bg-m3-primary hover:text-on-primary':
        isFullscreen,
    }"
    @click="$emit('click', $event)">
    <FullscreenIcon
      v-if="!isFullscreen"
      class="fill-on-surface group-hover:fill-surface transition-all" />
    <ExitFullscreenIcon
      v-else
      class="fill-on-surface-variant group-hover:fill-surface-container transition-all" />
    <span class="sr-only">Toggle fullscreen</span>
    <span class="not-sr-only hidden md:inline-block">
      {{ isFullscreen ? "Exit" : "" }} Fullscreen
    </span>
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
