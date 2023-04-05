<template>
  <div>
    <div v-if="totalResults !== undefined" class="mb-4">
      <p v-if="totalResults > 0">
        Showing <b>{{ matches.length }}</b> of
        <b>{{ totalResults }}</b> results.
      </p>
      <p v-else>No results found.</p>
    </div>
    <div class="grid grid-cols-auto-md gap-4">
      <TransitionGroup
        enterActiveClass="transform ease-out transition"
        enterFromClass="opacity-0"
        enterToClass="opacity-100"
        leaveActiveClass="transition ease-in"
        leaveFromClass="opacity-100"
        leaveToClass="opacity-0"
      >
        <SearchResultCard
          v-for="match in matches"
          :key="match.objectId"
          :searchMatch="match"
          :showDetails="false"
        />
        <!-- skeleton items while loading -->
        <SkeletonMediaCard
          v-for="i in 10"
          v-show="totalResults === undefined"
          :key="i"
        />
      </TransitionGroup>
    </div>

    <p v-if="matches.length > 6" class="my-4">
      Showing <b>{{ matches.length }}</b> of <b>{{ totalResults }}</b> results.
    </p>
  </div>

  <div v-if="hasMoreResults" class="mt-8">
    <Button
      variant="primary"
      class="btn btn-primary"
      :disabled="status === 'fetching'"
      @click="$emit('loadMore')"
    >
      Load more
    </Button>
  </div>
</template>
<script setup lang="ts">
import SearchResultCard from "@/components/SearchResultCard/SearchResultCard.vue";
import Button from "@/components/Button/Button.vue";
import SkeletonMediaCard from "@/components/MediaCard/SkeletonMediaCard.vue";
import { computed, watch } from "vue";
import { FetchStatus, SearchResultMatch } from "@/types";
import { useScroll } from "@vueuse/core";

const props = defineProps<{
  totalResults: number | undefined;
  matches: SearchResultMatch[];
  status: FetchStatus;
}>();

const emits = defineEmits<{
  (event: "loadMore");
}>();

const hasMoreResults = computed(() => {
  return (
    props.status !== "fetching" &&
    props.totalResults !== undefined &&
    props.matches.length < props.totalResults
  );
});

const { arrivedState } = useScroll(window, {
  offset: {
    bottom: 100,
  },
});

// lazy load more results when we get to the bottom of the page
watch(
  () => arrivedState.bottom,
  async () => {
    const shouldLoadMore =
      arrivedState.bottom && hasMoreResults && props.status !== "fetching";

    if (!shouldLoadMore) return;

    emits("loadMore");
  }
);
</script>
<style scoped></style>
