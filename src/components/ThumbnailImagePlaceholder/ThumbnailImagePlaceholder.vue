<template>
  <div
    class="inline-flex justify-center items-center bg-neutral-200 border border-neutral-300 text-neutral-400"
  >
    <ImageIcon />
    <slot />
  </div>
</template>
<script setup lang="ts">
import ImageIcon from "@/icons/ImageIcon.vue";
</script>
<style scoped></style>
