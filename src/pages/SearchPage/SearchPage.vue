<template>
  <DefaultLayout>
    <div class="search-results-page p-8 px-4">
      <div v-if="searchStore.isBrowsingCollection">
        <Link
          :to="`/search/listCollections`"
          class="flex items-center gap-1 mb-2"
        >
          <ArrowForwardIcon class="transform rotate-180 h-4 w-4" /> Back to
          Collections
        </Link>
        <h2 class="text-4xl mb-8 font-bold">Browsing {{ collectionName }}</h2>
      </div>
      <h2 v-else class="text-4xl mb-8 font-bold">
        <q>{{ searchStore.query }}</q>
      </h2>
      <p v-if="searchStore.status === 'error'">Error loading search results.</p>
      <div>
        <div v-if="searchStore.totalResults !== undefined" class="mb-4">
          <p v-if="searchStore.totalResults > 0">
            Showing <b>{{ searchStore.matches.length }}</b> of
            <b>{{ searchStore.totalResults }}</b> results.
          </p>
          <p v-else>No results found.</p>
        </div>
        <div ref="searchResultsContainer" class="grid grid-cols-auto-md gap-4">
          <TransitionGroup
            enterActiveClass="transform ease-out transition"
            enterFromClass="opacity-0"
            enterToClass="opacity-100"
            leaveActiveClass="transition ease-in"
            leaveFromClass="opacity-100"
            leaveToClass="opacity-0"
          >
            <SearchResultCard
              v-for="match in searchStore.matches"
              :key="match.objectId"
              :searchMatch="match"
              :showDetails="false"
            />
            <!-- skeleton items while loading -->
            <SkeletonMediaCard
              v-for="i in 10"
              v-show="searchStore.status === 'fetching'"
              :key="i"
            />
          </TransitionGroup>
        </div>

        <p v-if="searchStore.matches.length > 6" class="my-4">
          Showing <b>{{ searchStore.matches.length }}</b> of
          <b>{{ searchStore.totalResults }}</b> results.
        </p>
      </div>
      <div v-if="searchStore.hasMoreResults" class="mt-8">
        <Button
          variant="primary"
          class="btn btn-primary"
          :disabled="searchStore.status === 'fetching'"
          @click="handleLoadMoreClick"
        >
          Load more
        </Button>
      </div>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { watch, ref, computed } from "vue";
import { useScroll } from "@vueuse/core";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import SearchResultCard from "@/components/SearchResultCard/SearchResultCard.vue";
import Button from "@/components/Button/Button.vue";
import { useSearchStore } from "@/stores/searchStore";
import SkeletonMediaCard from "@/components/MediaCard/SkeletonMediaCard.vue";
import { AssetCollection } from "@/types";
import { useInstanceStore } from "@/stores/instanceStore";
import Link from "@/components/Link/Link.vue";
import { ArrowForwardIcon } from "@/icons";

const props = defineProps<{
  searchId: string;
}>();

const searchResultsContainer = ref<HTMLElement | null>(null);
const searchStore = useSearchStore();

// if search with this id is not currently in flight,
// then kick it off
watch(
  () => props.searchId,
  () => {
    if (searchStore.searchId === props.searchId) return;
    searchStore.searchById(props.searchId);
  },
  {
    immediate: true,
  }
);

const { arrivedState } = useScroll(window, {
  offset: {
    bottom: 100,
  },
});

// lazy load more results when we get to the bottom of the page
watch(
  () => arrivedState.bottom,
  async () => {
    // if we're not at the bottom, don't do anything
    // this handles the case when arrivedState.bottom changes from
    // true to false
    if (!arrivedState.bottom) return;

    // if we don't have any more results, or we're already in the process
    // of fetching more, then don't do anything
    if (!searchStore.hasMoreResults || searchStore.status === "fetching") {
      return;
    }

    searchStore.loadMore();
  }
);

function handleLoadMoreClick() {
  searchStore.loadMore();
}

const instanceStore = useInstanceStore();

const collections = computed((): AssetCollection[] | null => {
  if (!searchStore.isBrowsingCollection) return null;

  const collectionIdsAsStrings = searchStore.searchEntry?.collection ?? [];
  const collectionIds = collectionIdsAsStrings.map((id) => parseInt(id, 10));

  // map each collection id to the actual collection object
  return collectionIds
    .map((id: number) => instanceStore.getCollectionById(id))
    .filter((collection) => collection !== null) as AssetCollection[];
});

const collectionName = computed(() => {
  if (!collections.value) return "No Collection";
  return collections.value[0]?.title;
});
</script>
<style scoped></style>
