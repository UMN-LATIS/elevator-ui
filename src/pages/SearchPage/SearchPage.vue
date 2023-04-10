<template>
  <DefaultLayout>
    <div v-if="searchStore.isReady" class="search-results-page px-4">
      <BrowseCollectionHeader
        v-if="browsingCollectionId"
        :collectionId="browsingCollectionId"
      />
      <h2
        v-if="searchStore.searchEntry?.searchText"
        class="text-4xl my-8 font-bold"
      >
        <q>{{ searchStore.searchEntry.searchText }}</q>
      </h2>
      <h2
        v-if="!browsingCollectionId && !searchStore.searchEntry?.searchText"
        class="text-4xl my-8 font-bold"
      >
        All Assets
      </h2>
      <p v-if="searchStore.status === 'error'">Error loading search results.</p>
      <SearchResultsGrid
        :totalResults="searchStore.totalResults"
        :matches="searchStore.matches"
        :status="searchStore.status"
        @loadMore="() => searchStore.loadMore()"
      />
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { watch, computed } from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useSearchStore } from "@/stores/searchStore";
import SearchResultsGrid from "@/components/SearchResultsGrid/SearchResultsGrid.vue";
import BrowseCollectionHeader from "./BrowseCollectionHeader.vue";

const props = defineProps<{
  searchId: string;
}>();

const searchStore = useSearchStore();

// if search with this id is not currently in flight,
// then kick it off
watch(
  () => props.searchId,
  () => {
    if (searchStore.searchId === props.searchId) return;
    searchStore.searchById(props.searchId);
  },
  { immediate: true }
);

const browsingCollectionId = computed((): number | null => {
  const isBrowsing =
    searchStore.query === "" && searchStore.collectionIds?.length === 1;
  if (!isBrowsing) return null;
  return searchStore.collectionIds[0];
});
</script>
<style scoped></style>
