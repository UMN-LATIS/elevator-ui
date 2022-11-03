<template>
  <div
    ref="imgContainer"
    class="lazy-load-image relative w-full h-full min-w-16 min-h-16"
  >
    <img
      v-if="isLoaded"
      class="lazy-load-image__image block bg-neutral-100 opacity-0 transition-opacity"
      :class="{
        'opacity-100': isImageLoadComplete,
      }"
      :src="src"
      :alt="alt"
      v-bind="$attrs"
      @load="isImageLoadComplete = true"
    />
    <div
      v-if="!isImageLoadComplete"
      class="absolute inset-0 z-10 flex justify-center items-center bg-neutral-200 border border-neutral-300 text-neutral-400"
    >
      <Icon>image</Icon>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useIntersectionObserver } from "@vueuse/core";
import { ref, onMounted } from "vue";
import Icon from "../Icon/Icon.vue";
defineProps<{
  src: string;
  alt: string;
}>();

const observerOptions = {
  // load images when they are `rootMargin` pixels away from the viewport
  rootMargin: "640px",
  // load images when they are `threshold` within the viewport
  // (0 when just a tiny tiny bit, 1 when 100%)
  threshold: 0,
};

const imgContainer = ref<HTMLDivElement | null>(null);
const isLoaded = ref(false);
const isImageLoadComplete = ref(false);

function onIntersectionChange(
  entries: IntersectionObserverEntry[],
  observer: IntersectionObserver
) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      isLoaded.value = true;
      observer.unobserve(entry.target);
    }
  });
}

onMounted(() => {
  useIntersectionObserver(imgContainer, onIntersectionChange, observerOptions);
});
</script>
<style scoped></style>
