<template>
  <span
    class="more-like-this__count inline-flex items-center px-2 py-1 text-xs font-bold rounded-full">
    <slot />
  </span>
</template>
<script setup lang="ts"></script>
<style scoped>
.more-like-this__count {
  background-color: oklch(var(--surface-container));
  border: 1px solid oklch(var(--outline-variant));
  color: oklch(var(--on-surface));
}
</style>
