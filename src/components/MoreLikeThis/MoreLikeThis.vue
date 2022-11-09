<template>
  <div v-if="items.length" class="more-like-this pt-6 mt-6">
    <h3
      class="more-like-this__title flex flex-wrap items-center gap-2 mb-4 text-xl font-bold"
    >
      More Like This
      <span
        class="more-like-this__count inline-flex items-center px-2 py-1 text-xs font-normal rounded-full"
      >
        {{ items.length }}
      </span>
    </h3>

    <div ref="containerRef">
      <SearchResultCard
        v-for="searchMatch in items"
        :key="searchMatch.objectId"
        :searchMatch="searchMatch"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { SearchResultMatch } from "@/types";
import SearchResultCard from "../SearchResultCard/SearchResultCard.vue";
import { useIntersectionObserver } from "@vueuse/core";
import getScrollParent from "../LazyLoadImage/getScrollParent";
import api from "@/helpers/api";

const props = defineProps<{
  assetId: string;
}>();

const items = ref<SearchResultMatch[]>([]);
const containerRef = ref<HTMLElement | null>(null);
const isReadyForLoad = ref(false);
const isLoaded = ref(false);

// if the container is in view, we set
// isReadyForLoad to true
// (and leave the rest to the watch)
function onIntersectionChange(
  entries: IntersectionObserverEntry[],
  observer: IntersectionObserver
) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      isReadyForLoad.value = true;
      observer.unobserve(entry.target);
    }
  });
}

onMounted(() => {
  // set up an intersection observer to check if
  // the container element is in view (only if immediate is false)
  useIntersectionObserver(containerRef, onIntersectionChange, {
    root: getScrollParent(containerRef.value),
    rootMargin: "100px",
    threshold: 0,
  });
});

watch(
  [() => props.assetId, isReadyForLoad],
  async () => {
    if (!isReadyForLoad.value) return;
    items.value = await api.getMoreLikeThis(props.assetId);
    isLoaded.value = true;
  },
  { immediate: true }
);
</script>
<style scoped>
.more-like-this__title {
  color: var(--app-mediaCard-title-textColor);
}
.more-like-this__count {
  background-color: var(--app-mediaCard-backgroundColor);
  border: var(--app-mediaCard-borderWidth) solid
    var(--app-mediaCard-borderColor);
  font-weight: bold;
}
</style>
