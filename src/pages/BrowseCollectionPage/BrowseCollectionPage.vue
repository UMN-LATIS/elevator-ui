<template>
  <DefaultLayout>
    <div class="browse-collection-page px-4">
      <div class="pb-8 my-8">
        <Link :to="`/search/listCollections`" class="flex items-center gap-1">
          <ArrowForwardIcon class="transform rotate-180 h-4 w-4" /> Back to
          Collections
        </Link>
        <h2 class="text-4xl font-bold mt-4">
          Browsing {{ collection?.title ?? "..." }}
        </h2>
        <SanitizedHTML
          v-if="collection?.description"
          :html="collection.description"
          class="prose max-w-screen-lg mt-2"
        />
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
import SanitizedHTML from "@/components/SanitizedHTML/SanitizedHTML.vue";

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

async function updateCollection(id: number) {
  collection.value = await instanceStore.getCollectionById(id);
}
async function updateSearchResults(id: number) {
  searchId.value = await api.getSearchIdForCollection(id);
  searchStore.searchById(searchId.value);
}

watch(
  [() => props.collectionId, () => instanceStore.isReady],
  () => {
    if (!instanceStore.isReady) return;

    Promise.all([
      updateCollection(props.collectionId),
      updateSearchResults(props.collectionId),
    ]);
  },
  { immediate: true }
);
</script>
<style scoped></style>
