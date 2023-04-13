<template>
  <DefaultLayout class="search-results-page">
    <div class="px-4">
      <p v-if="searchStore.status === 'error'">Error loading search results.</p>

      <template v-if="searchStore.status === 'success'">
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
      </template>
      <Tabs
        labelsClass="sticky top-14 z-20 search-results-page__tabs -mx-4 px-4 border-b border-neutral-200 pt-4"
        :activeTabId="searchStore.resultsView"
        @tabChange="handleTabChange"
      >
        <Tab id="grid" label="Grid">
          <SearchResultsGrid
            :totalResults="searchStore.totalResults"
            :matches="searchStore.matches"
            :status="searchStore.status"
            @loadMore="() => searchStore.loadMore()"
          />
        </Tab>
        <Tab id="list" label="List">
          <SearchResultsList
            :totalResults="searchStore.totalResults"
            :matches="searchStore.matches"
            :status="searchStore.status"
            @loadMore="() => searchStore.loadMore()"
          />
        </Tab>
      </Tabs>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { watch, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useSearchStore } from "@/stores/searchStore";
import SearchResultsGrid from "@/components/SearchResultsGrid/SearchResultsGrid.vue";
import BrowseCollectionHeader from "./BrowseCollectionHeader.vue";
import Tab from "@/components/Tabs/Tab.vue";
import Tabs from "@/components/Tabs/Tabs.vue";
import SearchResultsList from "@/components/SearchResultsList/SearchResultsList.vue";
import type { SearchResultsView, Tab as TabType } from "@/types";
import { SEARCH_RESULTS_VIEWS } from "@/constants/constants";
import { nextTick } from "process";
import Skeleton from "@/components/Skeleton/Skeleton.vue";

const props = withDefaults(
  defineProps<{
    searchId: string;
    objectId: string | null;
    resultsView?: SearchResultsView;
  }>(),
  {
    objectId: null,
    resultsView: undefined,
  }
);

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

type SearchViewTab = TabType & { id: SearchResultsView };

const isSearchViewTab = (tab: TabType): tab is SearchViewTab => {
  return SEARCH_RESULTS_VIEWS.includes(tab.id as SearchResultsView);
};

const route = useRoute();
const router = useRouter();
function handleTabChange(tab: TabType) {
  if (!isSearchViewTab(tab)) throw new Error(`Invalid tab id: ${tab.id}`);

  searchStore.setResultsView(tab.id);

  // update the url query param to match state
  router.replace({
    query: {
      ...route.query,
      resultsView: tab.id,
    },
  });
}

onMounted(() => {
  const initialTabId = props.resultsView || searchStore.resultsView || "grid";
  // if the query param is set, use it to set the state
  // otherwise we'll fall back to the current resultsView
  // or failing that, the default "grid" view
  searchStore.setResultsView(initialTabId);

  // update the url query param to match state
  router.replace({
    query: {
      ...route.query,
      resultsView: initialTabId,
    },
  });
});

// scroll to objectId if it's in the search results
watch(
  () => props.objectId,
  (objectId) => {
    if (!objectId) return;
    nextTick(() => {
      const el = document.getElementById(`object-${objectId}`);
      if (!el) return;

      el.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  },
  { immediate: true }
);
</script>
<style scoped></style>
<style>
.search-results-page__tabs {
  background: var(--app-backgroundColor);
}

.search-results-page .app-header {
  z-index: 30; /* keep app header dropdowns above tabs */
  border-bottom-color: transparent !important;
}
</style>
