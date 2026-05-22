<template>
  <div class="page-content" :class="`page-content--${width}`">
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

<style scoped>
.page-content {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding: 2.5rem 1rem 3rem;
}

.page-content--default {
  max-width: 80rem;
}

.page-content--narrow {
  max-width: 56rem;
}

@media (min-width: 768px) {
  .page-content {
    padding: 2.5rem 1.5rem 3rem;
  }
}

@media (min-width: 1024px) {
  .page-content {
    padding: 2.5rem 2rem 3rem;
  }
}
</style>
