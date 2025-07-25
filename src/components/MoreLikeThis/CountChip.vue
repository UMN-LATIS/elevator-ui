<template>
  <span
    class="more-like-this__count inline-flex items-center px-2 py-1 text-xs font-bold rounded-full">
    <slot />
  </span>
</template>
<script setup lang="ts"></script>
<style scoped>
.more-like-this__count {
  background-color: var(--app-mediaCard-backgroundColor);
  border: var(--app-mediaCard-borderWidth) solid
    var(--app-mediaCard-borderColor);
  color: var(--app-mediaCard-title-textColor);
}
</style>
