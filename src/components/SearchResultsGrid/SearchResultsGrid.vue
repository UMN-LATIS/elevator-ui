<template>
  <div>
    <div class="grid grid-cols-auto-md gap-4">
      <SearchResultCard
        v-for="match in matches"
        :id="`object-${match.objectId}`"
        :key="match.objectId"
        :searchMatch="match"
        :showDetails="false"
        :showRemoveButton="showRemoveButton"
        :showAddToDrawerButton="showAddToDrawerButton"
        @remove="$emit('remove', match.objectId)"
      />
      <SkeletonCard
        v-for="i in Math.min(30, (totalResults ?? Infinity) - matches.length)"
        v-show="status === 'fetching'"
        :key="i"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import SearchResultCard from "@/components/SearchResultCard/SearchResultCard.vue";
import SkeletonCard from "@/components/SkeletonCard/SkeletonCard.vue";
import { computed, watch } from "vue";
import { FetchStatus, SearchResultMatch } from "@/types";
import { useScroll } from "@vueuse/core";

const props = withDefaults(
  defineProps<{
    totalResults?: number;
    matches: SearchResultMatch[];
    status: FetchStatus;
    drawerId?: number;
    showRemoveButton?: boolean;
    showAddToDrawerButton?: boolean;
  }>(),
  {
    totalResults: undefined,
    drawerId: undefined,
    showRemoveButton: false,
    showAddToDrawerButton: false,
  }
);

const emits = defineEmits<{
  (event: "loadMore");
  (event: "remove", objectId: string);
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
