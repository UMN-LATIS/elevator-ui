<template>
  <div class="drawer-results-embed-page p-4">
    <Transition name="fade" mode="out-in">
      <Notification
        v-if="isError"
        type="danger"
        title="Error loading results"
        message="There was an error loading the search results. Please try again later." />
      <div
        v-else-if="isLoading"
        class="flex items-center justify-center bg-surface-container p-4 gap-4 min-h-[480px]">
        <Skeleton width="100%" height="100%" class="rounded-none">
          Loading...
        </Skeleton>
      </div>
      <div v-else-if="drawer">
        <SearchResultsMap
          v-if="embedType === 'map'"
          :totalResults="drawer.totalResults"
          :matches="drawer.matches"
          status="success" />

        <SearchResultsTimeline
          v-else-if="embedType === 'timeline'"
          :totalResults="drawer.totalResults"
          :matches="drawer.matches"
          status="success" />

        <SearchResultsGallery
          v-else-if="embedType === 'gallery'"
          :totalResults="drawer.totalResults"
          :matches="drawer.matches"
          status="success" />
      </div>
      <div
        v-else
        class="flex items-center justify-center bg-surface-container p-4 gap-4 min-h-[480px]">
        <h2 class="text-2xl font-medium">No Results</h2>
        <p>We couldn't find any results for this drawer.</p>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import SearchResultsMap from "@/components/SearchResultsMap/SearchResultsMap.vue";
import SearchResultsTimeline from "@/components/SearchResultsTimeline/SearchResultsTimeline.vue";
import SearchResultsGallery from "@/components/SearchResultsGallery/SearchResultsGallery.vue";
import Skeleton from "@/components/Skeleton/Skeleton.vue";
import { useDrawerQuery } from "@/queries/useDrawerQuery";
import Notification from "@/components/Notification/Notification.vue";

const props = defineProps<{
  drawerId: number;
  embedType: "map" | "timeline" | "gallery";
}>();

const {
  data: drawer,
  isLoading,
  isError,
} = useDrawerQuery(() => props.drawerId);
</script>
