<template>
  <article class="border shadow-sm rounded-md overflow-hidden flex flex-col">
    <div
      class="placeholder-image bg-neutral-300 w-full aspect-video flex justify-center items-center overflow-hidden"
    >
      <img
        v-if="imgSrc"
        :src="imgSrc"
        :alt="imgAlt || 'Untitled'"
        loading="lazy"
        class="w-full h-full object-cover"
      />
      <ImageIcon v-else />
    </div>

    <div class="p-4 bg-white flex-1">
      <slot />
    </div>
  </article>
</template>
<script setup lang="ts">
import ImageIcon from "@/icons/ImageIcon.vue";

defineProps<{
  imgSrc?: string | null;
  imgAlt?: string | null;
}>();
</script>
<style scoped></style>
