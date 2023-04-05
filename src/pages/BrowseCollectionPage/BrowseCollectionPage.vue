<template>
  <DefaultLayout>
    <div class="search-results-page p-8 px-4">
      <div>
        <Link
          :to="`/search/listCollections`"
          class="flex items-center gap-1 mb-2"
        >
          <ArrowForwardIcon class="transform rotate-180 h-4 w-4" /> Back to
          Collections
        </Link>
        <h2 class="text-4xl mb-8 font-bold">
          Browsing {{ collection?.title }}
        </h2>
      </div>
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
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { watch, ref, onBeforeMount } from "vue";
import api from "@/api";
import { useSearchStore } from "@/stores/searchStore";
import { AssetCollection } from "@/types";
import { useInstanceStore } from "@/stores/instanceStore";
import Link from "@/components/Link/Link.vue";
import { ArrowForwardIcon } from "@/icons";
import SearchResultsGrid from "@/components/SearchResultsGrid/SearchResultsGrid.vue";

const props = defineProps<{
  collectionId: number;
}>();

const instanceStore = useInstanceStore();
const searchStore = useSearchStore();
const collection = ref<AssetCollection | null>(null);
const searchId = ref<string | null>(null);

onBeforeMount(() => {
  // clear any previous search results before component is mounted
  // so that we do a fresh search each time
  searchStore.reset();
});

watch(
  [() => props.collectionId, () => instanceStore.isReady],
  async () => {
    collection.value = instanceStore.getCollectionById(props.collectionId);
    searchId.value = await api.getSearchIdForCollection(props.collectionId);
    searchStore.searchById(searchId.value);
  },
  { immediate: true }
);
</script>
<style scoped></style>
