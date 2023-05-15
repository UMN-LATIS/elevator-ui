<template>
  <nav
    v-if="currentAssetIndex !== null"
    class="justify-between items-center gap-4 grid grid-cols-3 px-4 py-1"
  >
    <div class="flex justify-start">
      <Button
        v-if="previousAssetId"
        variant="tertiary"
        :to="getAssetUrl(previousAssetId)"
      >
        <ChevronLeftIcon class="h-3 w-3" />
        Prev
      </Button>
    </div>

    <div class="flex justify-center text-xs text-gray-500 leading-none p-2">
      <Button
        :to="{
          name: 'search',
          params: { searchId: searchStore.searchId },
          query: {
            objectId: assetStore.activeAssetId,
            resultsView: searchStore.resultsView,
          },
        }"
        variant="tertiary"
      >
        {{ currentAssetIndex + 1 }} of {{ searchStore.totalResults }}
      </Button>
    </div>

    <div class="flex justify-end">
      <Button
        v-if="nextAssetId"
        variant="tertiary"
        :to="getAssetUrl(nextAssetId)"
        class="!ml-0"
      >
        Next
        <ChevronRightIcon class="h-3 w-3" />
      </Button>
    </div>
  </nav>
</template>
<script setup lang="ts">
import { computed, watch } from "vue";
import Button from "@/components/Button/Button.vue";
import { ChevronRightIcon, ChevronLeftIcon } from "@/icons";
import { useAssetStore } from "@/stores/assetStore";
import { useSearchStore } from "@/stores/searchStore";
import { getAssetUrl } from "@/helpers/displayUtils";

const assetStore = useAssetStore();
const searchStore = useSearchStore();
const currentAssetIndex = computed((): number | null => {
  const { activeAssetId } = assetStore;
  if (!activeAssetId) return null;
  const index = searchStore.matches.findIndex(
    (match) => match.objectId === activeAssetId
  );
  return index === -1 ? null : index;
});

const LOAD_MORE_THRESHOLD = 5;

function shouldLoadMoreResults() {
  return (
    currentAssetIndex.value !== null &&
    searchStore.hasMoreResults &&
    searchStore.matches.length - currentAssetIndex.value <= LOAD_MORE_THRESHOLD
  );
}

watch([() => searchStore.matches, currentAssetIndex], () => {
  if (shouldLoadMoreResults()) {
    searchStore.loadMore();
  }
});

const previousAssetId = computed(() => {
  const currentIndex = currentAssetIndex.value;
  if (currentIndex === null || currentIndex <= 0) {
    return null;
  }
  return searchStore.matches[currentIndex - 1].objectId;
});

const nextAssetId = computed(() => {
  const currentIndex = currentAssetIndex.value;
  if (
    currentIndex === null || // no asset is active
    currentIndex + 1 >= searchStore.matches.length || // end of results
    searchStore.status == "fetching" // still loading more results
  ) {
    return null;
  }

  return searchStore.matches[currentIndex + 1]?.objectId ?? null;
});
</script>
<style scoped></style>
