<template>
  <MediaCard class="!opacity-25">
    <div class="animate-pulse flex space-x-4">
      <div class="flex-1 space-y-6 py-1">
        <div class="h-4 bg-neutral-300 rounded w-1/2"></div>
        <div class="h-2 bg-neutral-300 rounded"></div>
        <div class="space-y-3">
          <div class="grid grid-cols-3 gap-4">
            <div class="h-2 bg-neutral-300 rounded col-span-2"></div>
            <div class="h-2 bg-neutral-300 rounded col-span-1"></div>
          </div>
          <div class="h-2 bg-neutral-50 rounded"></div>
        </div>
      </div>
    </div>
  </MediaCard>
</template>
<script setup lang="ts">
import MediaCard from "./MediaCard.vue";
</script>
<style scoped></style>
