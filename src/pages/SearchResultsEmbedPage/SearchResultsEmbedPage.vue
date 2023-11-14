<template>
  <div class="p-4">
    <Transition name="fade" mode="out-in">
      <div
        v-if="!isReady"
        class="flex items-center justify-center bg-neutral-200 p-4 gap-4 min-h-[480px]">
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
import { watch, ref } from "vue";
import SearchResultsMap from "@/components/SearchResultsMap/SearchResultsMap.vue";
import SearchResultsTimeline from "@/components/SearchResultsTimeline/SearchResultsTimeline.vue";
import SearchResultsGallery from "@/components/SearchResultsGallery/SearchResultsGallery.vue";
import Skeleton from "@/components/Skeleton/Skeleton.vue";

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
