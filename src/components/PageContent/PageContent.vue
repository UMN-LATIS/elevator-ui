<template>
  <div
    class="w-full mx-auto pt-10 px-4 pb-12 md:px-6 lg:px-8"
    :class="width === 'narrow' ? 'max-w-4xl' : 'max-w-7xl'">
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    width?: "default" | "narrow";
  }>(),
  { width: "default" }
);
</script>
