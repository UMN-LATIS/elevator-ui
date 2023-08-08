<template>
  <component
    :is="to ? Link : 'div'"
    :to="to"
    class="media-card hover:no-underline group border rounded-md shadow-sm overflow-hidden opacity-75 focus:opacity-100 hover:opacity-100 hover:shadow-lg focus:shadow-lg"
  >
    <article class="flex flex-col w-full">
      <div class="placeholder-image aspect-video overflow-hidden">
        <div
          class="flex items-center justify-center w-full h-full media-card__image"
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
      </div>

      <div :to="to" class="flex-1 p-4 media-card__body hover:no-underline">
        <slot />
      </div>
      <slot name="footer"></slot>
    </article>
  </component>
</template>
<script setup lang="ts">
import { DocumentIcon } from "@/icons";
import LazyLoadImage from "@/components/LazyLoadImage/LazyLoadImage.vue";
import Link from "@/components/Link/Link.vue";

defineProps<{
  imgSrc?: string | null;
  imgAlt?: string | null;
  to?: string;
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
.media-card:focus {
  --hover-text-color: var(--color-blue-600);
  --hover-bg-color: var(--color-blue-50);
  background: var(--hover-bg-color);
  color: var(--hover-text-color);
  border-color: var(--hover-text-color);

  & :is(h1, h2, h3, h4, h5, a) {
    color: var(--hover-text-color);
  }
}
</style>
