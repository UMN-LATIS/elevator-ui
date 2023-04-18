<template>
  <div>
    <div class="flex flex-col gap-1">
      <TransitionGroup
        enterActiveClass="transform ease-out transition"
        enterFromClass="opacity-0"
        enterToClass="opacity-100"
        leaveActiveClass="transition ease-in"
        leaveFromClass="opacity-100"
        leaveToClass="opacity-0"
      >
        <SearchResultRow
          v-for="match in matches"
          :id="`object-${match.objectId}`"
          :key="match.objectId"
          :searchMatch="match"
          :showDetails="false"
        />
      </TransitionGroup>
    </div>
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
import Button from "@/components/Button/Button.vue";
import { computed, watch } from "vue";
import { FetchStatus, SearchResultMatch } from "@/types";
import { useScroll } from "@vueuse/core";
import SearchResultRow from "../SearchResultRow/SearchResultRow.vue";
import ResultsCount from "../ResultsCount/ResultsCount.vue";

const props = defineProps<{
  totalResults?: number;
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
