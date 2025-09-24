<template>
  <article
    class="media-card flex flex-col overflow-hidden border rounded-md shadow-sm">
    <div class="placeholder-image aspect-video overflow-hidden">
      <div
        class="flex items-center justify-center w-full h-full media-card__image">
        <LazyLoadImage
          v-if="imgSrc"
          :src="imgSrc"
          :alt="imgAlt || 'Untitled'"
          loading="lazy"
          class="app-object-fit w-full h-full" />
        <DocumentIcon v-else />
      </div>
    </div>

    <div class="flex-1 p-4 media-card__body hover:no-underline">
      <slot />
    </div>
    <slot name="footer"></slot>
  </article>
</template>
<script setup lang="ts">
import { DocumentIcon } from "@/icons";
import LazyLoadImage from "@/components/LazyLoadImage/LazyLoadImage.vue";

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

  & :is(h1, h2, h3, h4, h5, a) {
    color: var(--app-mediaCard-textColor);
  }
}

.media-card__image {
  background: var(--app-thumbnailImage-backgroundColor);
  color: var(--app-thumbnailImage-textColor);
}

.media-card:has(.media-card__image:hover),
.media-card:has(.media-card__body:hover),
a:focus .media-card {
  background: var(--app-mediaCard-hover-backgroundColor, var(--color-blue-50));
  color: var(--app-mediaCard-hover-textColor, var(--color-blue-600));
  border-color: var(--app-mediaCard-hover-borderColor, var(--color-blue-600));

  & :is(h1, h2, h3, h4, h5, a) {
    color: var(--hover-text-color);
  }
}
</style>
