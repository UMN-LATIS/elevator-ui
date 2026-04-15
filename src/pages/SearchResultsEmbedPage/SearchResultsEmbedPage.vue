<template>
  <div class="search-results-embed-page p-4">
    <Transition name="fade" mode="out-in">
      <div
        v-if="!isReady"
        class="flex items-center justify-center bg-surface-container p-4 gap-4 min-h-[480px]">
        <Skeleton width="100%" height="100%" class="rounded-none">
          Loading...
        </Skeleton>
      </div>

      <div v-else>
        <SearchResultsMap
          v-if="embedType === 'map'"
          class=""
          :totalResults="searchStore.totalResults"
          :matches="searchStore.matches"
          :status="searchStore.status"
          @loadMore="() => searchStore.loadMore()" />

        <SearchResultsTimeline
          v-else-if="embedType === 'timeline'"
          :totalResults="searchStore.totalResults ?? Infinity"
          :matches="searchStore.matches"
          :status="searchStore.status"
          @loadMore="() => searchStore.loadMore()" />

        <SearchResultsGallery
          v-else-if="embedType === 'gallery'"
          :totalResults="searchStore.totalResults ?? Infinity"
          :matches="searchStore.matches"
          :status="searchStore.status"
          @loadMore="() => searchStore.loadMore()" />
      </div>
    </Transition>
  </div>
</template>
<script setup lang="ts">
import { useSearchStore } from "@/stores/searchStore";
import { watch, ref, defineAsyncComponent, h } from "vue";
import Skeleton from "@/components/Skeleton/Skeleton.vue";

// Each embed renders exactly one of these — lazy so we only download the
// chunk for the embed type the URL actually requested.
const embedFallback = { render: () => h(Skeleton, { height: "100dvh" }) };
const SearchResultsMap = defineAsyncComponent({
  loader: () => import("@/components/SearchResultsMap/SearchResultsMap.vue"),
  loadingComponent: embedFallback,
});
const SearchResultsTimeline = defineAsyncComponent({
  loader: () =>
    import("@/components/SearchResultsTimeline/SearchResultsTimeline.vue"),
  loadingComponent: embedFallback,
});
const SearchResultsGallery = defineAsyncComponent({
  loader: () =>
    import("@/components/SearchResultsGallery/SearchResultsGallery.vue"),
  loadingComponent: embedFallback,
});

const props = defineProps<{
  searchId: string;
  embedType: "map" | "timeline" | "gallery";
}>();

const searchStore = useSearchStore();

const isReady = ref(false);
searchStore.onBeforeNewSearch(() => {
  isReady.value = false;
});
searchStore.onAfterNewSearch(() => {
  isReady.value = true;
});

watch(
  () => props.searchId,
  () => {
    const loadAll = ["map", "timeline"].includes(props.embedType);
    searchStore.search(props.searchId, { loadAll });
  },
  { immediate: true }
);
</script>
<style scoped></style>
