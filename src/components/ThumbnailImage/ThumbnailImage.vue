<template>
  <component
    :is="href ? 'a' : 'div'"
    :href="href"
    class="thumbnail-image block rounded overflow-hidden hover:shadow-md w-24 aspect-square relative border border-transparent-black-200 shadow-sm opacity-75 hover:opacity-100 group transition-all"
    :class="{
      'thumbnail-image--is-active ring ring-offset-1 ring-blue-600': isActive,
    }"
  >
    <div
      class="thumbnail-image__icon absolute z-10 bg-transparent-white-500 rounded-full w-12 h-12 flex justify-center items-center backdrop-blur-sm top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-0 group-hover:scale-100 transition-all"
    >
      <ArrowForwardIcon class="text-neutral-900" />
    </div>
    <LazyLoadImage
      :src="src"
      :alt="alt"
      class="group-hover:scale-110 w-full h-full object-cover transition-all"
    />
    <slot />
  </component>
</template>
<script setup lang="ts">
import LazyLoadImage from "@/components/LazyLoadImage/LazyLoadImage.vue";
import ArrowForwardIcon from "@/icons/ArrowForwardIcon.vue";

withDefaults(
  defineProps<{
    src: string;
    alt: string | null;
    href?: string;
    isActive?: boolean;
  }>(),
  {
    href: undefined,
    isActive: false,
  }
);
</script>
<style scoped>
.thumbnail-image--is-active {
  --tw-ring-color: var(--app-thumbnailImage-active-ringColor);
}
</style>
