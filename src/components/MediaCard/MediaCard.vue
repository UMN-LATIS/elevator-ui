<template>
  <article class="max-w-sm border shadow-sm rounded-md overflow-hidden">
    <div
      class="placeholder-image bg-neutral-300 w-full aspect-square flex justify-center items-center overflow-hidden"
    >
      <img
        v-if="imgSrc"
        :src="imgSrc"
        :alt="imgAlt || title"
        class="w-full h-full object-cover"
      />
      <Icon v-else>{{ fallbackThumbnailIcon || "image" }}</Icon>
    </div>

    <div class="p-4">
      <h1 class="font-bold text-xl mb-4">{{ title }}</h1>

      <slot />
    </div>
  </article>
</template>
<script setup lang="ts">
import Icon from "@/components/Icon/Icon.vue";

defineProps<{
  imgSrc?: string | null;
  imgAlt?: string | null;
  fallbackThumbnailIcon?: string;
  title: string;
}>();
</script>
<style scoped></style>
