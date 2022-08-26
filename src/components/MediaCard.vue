<template>
  <article class="media-card bg-neutral-100 p-1 rounded-lg">
    <ThumbnailImage :src="image" :alt="image" />
    <div class="px-2 py-1">
      <h1 class="font-bold text-neutral-800 my-1 leading-5">{{ label }}</h1>
      <ul
        class="text-sm text-neutral-500"
        :class="{ 'line-clamp-3': !showAllDetails }"
      >
        <li v-for="(item, i) in details" :key="i">{{ item }}</li>
      </ul>
      <div class="flex justify-end items-center my-2">
        <IconButton
          :href="href"
          label="Read More"
          icon="arrow_forward"
          class="bg-neutral-200 text-neutral-700 rounded-full p-1 hover:no-underline hover:shadow-sm hover:bg-neutral-900 hover:text-neutral-100"
        />
      </div>
    </div>
  </article>
</template>
<script setup lang="ts">
import { ref } from "vue";
import IconButton from "./IconButton.vue";
import ThumbnailImage from "./ThumbnailImage.vue";

withDefaults(
  defineProps<{
    image: string;
    href: string;
    label: string;
    details?: string[];
  }>(),
  {
    details: () => [],
  }
);

const showAllDetails = ref(false);
</script>
<style scoped></style>
