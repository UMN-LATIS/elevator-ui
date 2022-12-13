<template>
  <DefaultLayout>
    <div ref="searchResultsContainer" class="search-results-page p-8 px-4">
      <h2 class="text-4xl mb-8 font-bold">
        <q>{{ searchStore.query }}</q>
      </h2>
      <div v-if="searchStore.status === 'fetching'">
        <SpinnerIcon />
      </div>
      <p v-if="searchStore.status === 'error'">Error loading search results.</p>
      <div v-if="searchStore.status === 'success'">
        <div class="mb-4">
          <p v-if="searchStore.matches.length === 0">No results found.</p>
          <p v-else>
            Showing <b>{{ searchStore.matches.length }}</b> of
            <b>{{ searchStore.totalResults }}</b> results.
          </p>
        </div>
        <div class="grid grid-cols-auto-md gap-4">
          <SearchResultCard
            v-for="match in searchStore.matches"
            :key="match.objectId"
            :searchMatch="match"
            :showDetails="false"
          />
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
import { watch, ref } from "vue";
// import { useInfiniteScroll } from "@vueuse/core";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import SearchResultCard from "@/components/SearchResultCard/SearchResultCard.vue";
import { SpinnerIcon } from "@/icons";
import Button from "@/components/Button/Button.vue";
import { useSearchStore } from "@/stores/searchStore";
import getScrollParent from "@/helpers/getScrollParent";

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

// onMounted(() => {
//   const scrollParentOfSearchResults = getScrollParent(
//     searchResultsContainer.value
//   );

//   useInfiniteScroll(
//     scrollParentOfSearchResults,
//     async () => {
//       // save the scroll position so we can restore it after loading more
//       const scrollY = scrollParentOfSearchResults.scrollTop;
//       await searchStore.loadMore();
//       // restore the scroll position
//       scrollParentOfSearchResults.scrollTop = scrollY;
//     },
//     {
//       distance: 10,
//     }
//   );
// });

async function handleLoadMoreClick() {
  const scrollParentOfSearchResults = getScrollParent(
    searchResultsContainer.value
  );
  // save the scroll position so we can restore it after loading more
  const scrollY = scrollParentOfSearchResults.scrollTop;
  await searchStore.loadMore();
  // restore the scroll position
  scrollParentOfSearchResults.scrollTop = scrollY;
}
</script>
<style scoped></style>
