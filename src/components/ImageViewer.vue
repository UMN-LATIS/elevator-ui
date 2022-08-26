<template>
  <div class="image-viewer relative">
    <slot />
    <div
      class="sm:absolute sm:bottom-0 sm:left-1/2 sm:-translate-x-1/2 sm:p-4 sm:rounded-lg w-full"
    >
      <ImageViewerToolbar />
    </div>
  </div>
</template>
<script setup lang="ts">
import ImageViewerToolbar from "./ImageViewerToolbar.vue";
</script>
