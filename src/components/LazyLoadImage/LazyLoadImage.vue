<template>
  <div ref="imgContainer" class="lazy-load-image relative">
    <img
      v-if="isLoaded"
      class="lazy-load-image__image bg-neutral-100 block transition-opacity opacity-0"
      :class="{
        'opacity-100': isImageLoadComplete,
      }"
      :src="src"
      :alt="alt ?? ''"
      v-bind="$attrs"
      @load="isImageLoadComplete = true" />
    <div
      v-if="!isImageLoadComplete"
      class="lazy-load-image__placeholder bg-neutral-200 text-neutral-400 absolute inset-0 z-10 flex items-center justify-center">
      <ImageIcon />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useIntersectionObserver } from "@vueuse/core";
import { ref, onMounted, useTemplateRef } from "vue";
import ImageIcon from "@/icons/ImageIcon.vue";
import getScrollParent from "../../helpers/getScrollParent";

defineProps<{
  src: string;
  alt: string | null;
}>();

const imgContainer = useTemplateRef("imgContainer");
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
  const observerOptions = {
    // root needs to be a scrollable element
    // if the document body isn't scrollable, then rootMargin won't work
    root: getScrollParent(imgContainer.value),

    // load images when they are `rootMargin` pixels away from the viewport
    rootMargin: "640px",

    // load images when they are `threshold` within the viewport
    // (0 when just a tiny tiny bit, 1 when 100%)
    threshold: 0,
  };
  useIntersectionObserver(imgContainer, onIntersectionChange, observerOptions);
});
</script>
<style scoped>
.lazy-load-image__placeholder {
  background: var(--surface-container);
  color: var(--on-surface-variant);
}
</style>
