<template>
  <button
    class="x-button inline-flex bg-outline text-on-surface-variant w-8 h-8 rounded-full leading-none items-center justify-center transition ease-in-out hover:bg-outline-variant hover:text-on-surface"
    @click="$emit('click')">
    <XIcon />
    <slot>
      <span class="sr-only">Close</span>
    </slot>
  </button>
</template>
<script setup lang="ts">
import XIcon from "@/icons/XIcon.vue";

defineEmits<{
  (eventName: "click");
}>();
</script>
<style scoped></style>
