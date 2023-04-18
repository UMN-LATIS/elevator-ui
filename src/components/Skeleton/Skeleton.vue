<template>
  <div
    :class="`skeleton skeleton--${variant} rounded-md max-w-lg animate-pulse bg-neutral-200 flex items-center justify-center`"
  >
    <slot />
  </div>
</template>
<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: "rect" | "circle";
    width?: string;
    height?: string;
  }>(),
  {
    variant: "rect",
    width: "100%",
    height: "1rem",
  }
);
</script>
<style scoped>
.skeleton {
  width: v-bind(width);
  height: v-bind(height);
}

.skeleton--circle {
  border-radius: 50%;
}
</style>
