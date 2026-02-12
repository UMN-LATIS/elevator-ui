<template>
  <div class="search-results-list">
    <div class="flex flex-col gap-1 max-w-screen-md mx-auto">
      <SearchResultRow
        v-for="match in matches"
        :id="`object-${match.objectId}`"
        :key="match.objectId"
        :searchMatch="match"
        :showDetails="false" />
      <SkeletonResultRow
        v-for="i in Math.min(30, (totalResults ?? Infinity) - matches.length)"
        v-show="status === 'fetching'"
        :key="i" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, watch } from "vue";
import { FetchStatus, SearchResultMatch } from "@/types";
import { useScroll } from "@vueuse/core";
import SearchResultRow from "../SearchResultRow/SearchResultRow.vue";
import SkeletonResultRow from "../SkeletonResultRow/SkeletonResultRow.vue";

const props = defineProps<{
  totalResults?: number;
  matches: SearchResultMatch[];
  status: FetchStatus;
}>();

const emits = defineEmits<{
  (event: "loadMore");
}>();

const { arrivedState } = useScroll(window, {
  offset: { bottom: 100 },
});

watch(
  arrivedState,
  (arrived) => {
    // Prevent infinite loop: don't trigger loadMore if we have no matches yet
    // but totalResults > 0 (indicates bad/incomplete data from backend)
    const hasInitialData = props.matches.length > 0 || props.totalResults === 0;

    if (
      arrived.bottom &&
      hasMoreResults.value &&
      props.status !== "fetching" &&
      hasInitialData
    ) {
      emits("loadMore");
    }
  },
  { immediate: true }
);

const hasMoreResults = computed(() => {
  return (props.totalResults ?? Infinity) > props.matches.length;
});
</script>
<style scoped></style>
