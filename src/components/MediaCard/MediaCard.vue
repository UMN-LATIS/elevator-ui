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
  background: transparent;
  color: oklch(var(--on-surface));
  border: 1px solid oklch(var(--outline-variant));

  & :is(h1, h2, h3, h4, h5, a) {
    color: oklch(var(--on-surface));
  }
}

[data-theme="dark"] .media-card {
  background: oklch(var(--surface-container));
}

.media-card__image {
  background: oklch(var(--surface-container));
  color: oklch(var(--on-surface-variant));
}

.media-card:has(.media-card__image:hover),
.media-card:has(.media-card__body:hover),
a:focus .media-card {
  background: oklch(var(--primary-container));
  color: oklch(var(--primary));
  border-color: oklch(var(--primary));

  & :is(h1, h2, h3, h4, h5, a) {
    color: oklch(var(--primary));
  }
}
</style>
