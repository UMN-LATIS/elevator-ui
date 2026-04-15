<template>
  <div
    data-testid="asset-view-skeleton"
    class="asset-view-skeleton md:h-full relative pb-16 md:pb-0 flex flex-col md:flex-row gap-4 p-4">
    <div class="flex-1 flex flex-col gap-4 min-w-0">
      <Skeleton variant="rect" height="50dvh" />
      <div class="flex gap-2">
        <Skeleton variant="rect" width="6rem" height="2rem" />
        <Skeleton variant="rect" width="6rem" height="2rem" />
      </div>
    </div>
    <div class="md:w-sm flex flex-col gap-3">
      <Skeleton variant="rect" height="1.5rem" width="70%" />
      <Skeleton variant="rect" height="1rem" width="100%" />
      <Skeleton variant="rect" height="1rem" width="90%" />
      <Skeleton variant="rect" height="1rem" width="95%" />
      <Skeleton variant="rect" height="1rem" width="60%" />
    </div>
  </div>
</template>
<script setup lang="ts">
import Skeleton from "@/components/Skeleton/Skeleton.vue";
</script>
