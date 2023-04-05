<template>
  <DefaultLayout>
    <div class="search-results-page p-8 px-4">
      <h2 class="text-4xl mb-8 font-bold">
        <q>{{ searchStore.query }}</q>
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
import { watch } from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useSearchStore } from "@/stores/searchStore";
import SearchResultsGrid from "@/components/SearchResultsGrid/SearchResultsGrid.vue";

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
</script>
<style scoped></style>
