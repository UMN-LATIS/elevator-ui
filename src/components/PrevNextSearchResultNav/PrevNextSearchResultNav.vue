<template>
  <div
    v-if="currentAssetIndex !== null"
    class="flex justify-between py-2 px-4 items-center gap-4"
  >
    <Button
      v-if="previousAssetId"
      variant="tertiary"
      :to="getAssetUrl(previousAssetId)"
      class="!ml-0"
    >
      <ChevronLeftIcon class="h-3 w-3" />
      Prev
    </Button>

    <div class="text-xs text-gray-500 leading-none p-2">
      {{ currentAssetIndex + 1 }} of {{ searchStore.totalResults }}
    </div>

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
  // if there is no current asset index, we're done
  if (currentAssetIndex.value === null) return false;

  // if we're not within LOAD_MORE_THRESHOLD of the end of the searchStore.matches array, we're done
  if (
    searchStore.matches.length - currentAssetIndex.value >
    LOAD_MORE_THRESHOLD
  )
    return false;

  // if there's no more results to load, we're done
  if (!searchStore.hasMoreResults) return false;

  // otherwise, we should load more results
  return true;
}

watch([() => searchStore.matches, currentAssetIndex], () => {
  if (shouldLoadMoreResults()) {
    searchStore.loadMore();
  }
});

const previousAssetId = computed(() => {
  if (currentAssetIndex.value === null) return null;
  if (currentAssetIndex.value <= 0) return null;
  return searchStore.matches[currentAssetIndex.value - 1].objectId;
});

const nextAssetId = computed(() => {
  if (currentAssetIndex.value === null) return null;
  if (currentAssetIndex.value >= searchStore.matches.length - 1) return null;
  if (searchStore.status == "fetching") return null;

  return searchStore.matches[currentAssetIndex.value + 1].objectId;
});
</script>
<style scoped></style>
