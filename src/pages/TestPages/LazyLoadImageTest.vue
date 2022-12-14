<template>
  <NoScrollLayout>
    <div class="lazy-load-page relative translate-x-0 tranlate-y-0 h-full">
      <h1 class="text-xl">LazyLoad Test Page</h1>
      <div class="fixed top-0 left-0 w-1/3 bg-gray-50 h-full overflow-scroll">
        <div v-for="i in 400" :key="i">
          <ThumbnailImage
            :src="`https://picsum.photos/seed/${i}/300/300`"
            :alt="`img ${i}`"
          />
        </div>
      </div>
    </div>
  </NoScrollLayout>
</template>
<script setup lang="ts">
import NoScrollLayout from "@/layouts/NoScrollLayout.vue";
import ThumbnailImage from "@/components/ThumbnailImage/ThumbnailImage.vue";
// import { nextTick, onMounted, ref } from "vue";
</script>
<style scoped></style>
