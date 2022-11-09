<template>
  <div
    class="thumbnail-image-placeholder w-32 aspect-square inline-flex justify-center items-center flex-col border rounded"
  >
    <ImageIcon class="thumbnail-image-placeholder__icon" />
    <slot />
  </div>
</template>
<script setup lang="ts">
import ImageIcon from "@/icons/ImageIcon.vue";
</script>
<style scoped>
.thumbnail-image-placeholder {
  border-color: var(--app-thumbnailImage-borderColor);
  background: var(--app-thumbnailImage-backgroundColor);
  color: var(--app-thumbnailImage-textColor);
}
</style>
