<template>
  <article
    class="media-card flex flex-col overflow-hidden border rounded-md shadow-sm"
  >
    <div
      class="placeholder-image aspect-video flex items-center justify-center w-full overflow-hidden bg-transparent-black-200 border-b-transparent-black-600"
    >
      <LazyLoadImage
        v-if="imgSrc"
        :src="imgSrc"
        :alt="imgAlt || 'Untitled'"
        loading="lazy"
        class="object-cover w-full h-full"
      />
      <DocumentIcon v-else />
    </div>

    <div class="flex-1 p-4">
      <slot />
    </div>
  </article>
</template>
<script setup lang="ts">
import { DocumentIcon } from "@/icons";
import LazyLoadImage from "../LazyLoadImage/LazyLoadImage.vue";

defineProps<{
  imgSrc?: string | null;
  imgAlt?: string | null;
}>();
</script>
<style scoped>
.media-card {
  background: var(--app-mediaCard-backgroundColor);
  color: var(--app-mediaCard-textColor);
  border: var(--app-mediaCard-borderWidth) solid
    var(--app-mediaCard-borderColor);
}
</style>
