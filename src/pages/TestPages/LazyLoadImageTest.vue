<template>
  <DefaultLayout>
    <div class="lazy-load-page">
      <h1 class="text-xl">LazyLoad Test Page</h1>
      <div v-for="i in 400" :key="i">
        <LazyLoadImage
          :src="`https://picsum.photos/seed/${i}/300/300`"
          :alt="`img ${i}`"
        />
      </div>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import LazyLoadImage from "@/components/LazyLoadImage/LazyLoadImage.vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
// import { nextTick, onMounted, ref } from "vue";
</script>
<style scoped></style>
