<template>
  <div>
    <div class="flex flex-col gap-1">
      <VirtualScroller
        v-slot="{ item: match }"
        :items="matches"
        keyField="objectId"
      >
        <SearchResultRow
          :id="`object-${match.objectId}`"
          :key="match.objectId"
          :searchMatch="match"
          :showDetails="false"
        />
      </VirtualScroller>
      <!-- <SkeletonResultRow
        v-for="i in Math.min(30, (totalResults ?? Infinity) - matches.length)"
        v-show="status === 'fetching'"
        :key="i"
      /> -->
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, watch } from "vue";
import { FetchStatus, SearchResultMatch } from "@/types";
import { useScroll } from "@vueuse/core";
import SearchResultRow from "../SearchResultRow/SearchResultRow.vue";
import SkeletonResultRow from "@/components/SkeletonResultRow/SkeletonResultRow.vue";
import VirtualScroller from "@/components/VirtualScroller/VirtualScroller.vue";

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
    if (arrived.bottom && hasMoreResults.value && props.status !== "fetching") {
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
