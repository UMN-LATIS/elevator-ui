<template>
  <div
    class="skeleton-result-row flex bg-surface-dim p-2 sm:p-4 gap-4 rounded-md border-2 border-transparent">
    <Skeleton width="4rem" height="4rem">
      <ImageIcon class="opacity-25" />
    </Skeleton>
    <div class="flex-1">
      <Skeleton width="25%" height="1.25rem" class="mb-4" />

      <Skeleton
        v-for="i in 2"
        :key="i"
        class="my-2"
        height="0.75rem"
        width="50%" />
    </div>
  </div>
</template>
<script setup lang="ts">
import Skeleton from "@/components/Skeleton/Skeleton.vue";
import ImageIcon from "@/icons/ImageIcon.vue";
</script>
<style scoped></style>
