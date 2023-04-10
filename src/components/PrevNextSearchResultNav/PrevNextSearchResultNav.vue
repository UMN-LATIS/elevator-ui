<template>
  <nav
    v-if="currentAssetIndex !== null"
    class="justify-between py-2 px-4 items-center gap-4 grid grid-cols-3"
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
      {{ currentAssetIndex + 1 }} of {{ searchStore.totalResults }}
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
  const currentIndex = currentAssetIndex.value;
  if (currentIndex === null || currentIndex <= 0) {
    return null;
  }
  return searchStore.matches[currentIndex - 1].objectId;
});

const nextAssetId = computed(() => {
  const currentIndex = currentAssetIndex.value;
  if (currentIndex === null || currentIndex + 1 >= searchStore.matches.length) {
    return null;
  }

  // if we're loading more, return null for now
  // this will be recomputed once the
  // searchStore.matches array is updated
  if (searchStore.status == "fetching") return null;

  return searchStore.matches[currentIndex + 1].objectId;
});
</script>
<style scoped></style>
