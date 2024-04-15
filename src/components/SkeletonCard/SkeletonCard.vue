<template>
  <article
    class="skeleton-card flex flex-col overflow-hidden border rounded-md shadow-sm">
    <div
      class="placeholder-image aspect-video flex items-center justify-center w-full overflow-hidden">
      <Skeleton width="100%" height="100%" class="rounded-none">
        <ImageIcon class="opacity-25 w-8 h-8" />
      </Skeleton>
    </div>

    <div class="flex-1 p-4">
      <Skeleton height="1.5rem" width="50%" class="mb-4" />
      <Skeleton v-for="i in 3" :key="i" class="mb-2" height="0.75rem" />
    </div>
  </article>
</template>
<script setup lang="ts">
import Skeleton from "@/components/Skeleton/Skeleton.vue";
import ImageIcon from "@/icons/ImageIcon.vue";
</script>
<style scoped></style>
