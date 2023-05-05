<template>
  <DefaultLayout class="search-results-page">
    <div class="px-4">
      <SearchErrorNotification v-if="searchStore.status === 'error'" />
      <template v-else>
        <BrowseCollectionHeader
          v-if="browsingCollectionId"
          :collectionId="browsingCollectionId"
        />
        <h2 v-else class="text-4xl my-8 font-bold">
          <q>{{ searchStore.searchEntry?.searchText ?? searchStore.query }}</q>
        </h2>

        <Tabs
          labelsClass="sticky top-14 z-20 search-results-page__tabs -mx-4 px-4 border-b border-neutral-200 pt-4"
          :activeTabId="searchStore.resultsView"
          @tabChange="handleTabChange"
        >
          <div class="flex justify-between mb-4 items-baseline">
            <ResultsCount
              :showingCount="searchStore.matches.length"
              :total="searchStore.totalResults ?? 0"
              :status="searchStore.status"
              class="mb-2"
              @loadMore="() => searchStore.loadMore({ loadAll: true })"
            >
              <template #loadMoreButtonLabel>
                {{
                  // if we have 1000+ results, then we can't load all at once
                  (searchStore.totalResults ?? 0) <= 1000
                    ? "Load All"
                    : "Load More"
                }}
              </template>
            </ResultsCount>
            <SearchResultsSortSelect
              v-if="['grid', 'list'].includes(searchStore.resultsView)"
              :sortOptions="searchStore.sortOptions"
              :selectedSortOption="searchStore.sort"
              @sortOptionChange="handleSortOptionChange"
            />
          </div>
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
          <Tab id="timeline" label="Timeline">
            <SearchResultsTimeline
              v-if="
                searchStore.totalResults && searchStore.status === 'success'
              "
              :totalResults="searchStore.totalResults"
              :matches="searchStore.matches"
              :status="searchStore.status"
              @loadMore="() => searchStore.loadMore()"
            />
          </Tab>
          <Tab id="map" label="Map">
            <SearchResultsMap
              v-if="searchStore.isReady"
              :totalResults="searchStore.totalResults"
              :matches="searchStore.matches"
              :status="searchStore.status"
              @loadMore="() => searchStore.loadMore()"
            />
          </Tab>
          <Tab id="gallery" label="Gallery">
            <SearchResultsGallery
              :totalResults="searchStore.totalResults ?? Infinity"
              :matches="searchStore.matches"
              :status="searchStore.status"
              @loadMore="() => searchStore.loadMore()"
            />
          </Tab>

          <ResultsCount
            v-if="
              ['grid', 'list'].includes(searchStore.resultsView) &&
              (searchStore.totalResults ?? 0) > 6
            "
            :showingCount="searchStore.matches.length"
            :total="searchStore.totalResults ?? 0"
            :status="searchStore.status"
            class="mt-4"
            @loadMore="() => searchStore.loadMore({ loadAll: true })"
          >
            <template #loadMoreButtonLabel>
              {{
                // if we have 1000+ results, then we can't load all at once
                (searchStore.totalResults ?? 0) <= 1000
                  ? "Load All"
                  : "Load More"
              }}
            </template>
          </ResultsCount>
        </Tabs>
      </template>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { watch, computed, onMounted, nextTick, ref } from "vue";
import { useRouter, useRoute, onBeforeRouteLeave } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useSearchStore } from "@/stores/searchStore";
import BrowseCollectionHeader from "./BrowseCollectionHeader.vue";
import Tab from "@/components/Tabs/Tab.vue";
import Tabs from "@/components/Tabs/Tabs.vue";
import SearchResultsGrid from "@/components/SearchResultsGrid/SearchResultsGrid.vue";
import SearchResultsList from "@/components/SearchResultsList/SearchResultsList.vue";
import SearchResultsTimeline from "@/components/SearchResultsTimeline/SearchResultsTimeline.vue";
import SearchResultsMap from "@/components/SearchResultsMap/SearchResultsMap.vue";
import SearchResultsGallery from "@/components/SearchResultsGallery/SearchResultsGallery.vue";
import ResultsCount from "@/components/ResultsCount/ResultsCount.vue";
import type {
  SearchResultsView,
  SearchSortOptions,
  Tab as TabType,
} from "@/types";
import { SEARCH_RESULTS_VIEWS } from "@/constants/constants";
import SearchResultsSortSelect from "@/components/SearchResultsSortSelect/SearchResultsSortSelect.vue";
import SearchErrorNotification from "./SearchErrorNotification.vue";

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

// will be true once a new search with a new searchId has been loaded for the
// first time this is used to get tabs to remount with new search results
// preventing old results from displaying.
const isNewSearchReadyForDisplay = ref(false);
searchStore.onBeforeNewSearch(() => {
  isNewSearchReadyForDisplay.value = false;
});
searchStore.onAfterNewSearch(() => {
  isNewSearchReadyForDisplay.value = true;
});

// if search with this id is not currently in flight,
// then kick it off
watch(
  () => props.searchId,
  () => {
    if (searchStore.searchId === props.searchId) {
      isNewSearchReadyForDisplay.value = true;
      return;
    }
    searchStore.search(props.searchId);
  },
  { immediate: true }
);

const browsingCollectionId = computed((): number | null => {
  const isBrowsing =
    searchStore.searchEntry?.searchText === "" &&
    searchStore.collectionIds?.length === 1;
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

async function handleSortOptionChange(sortOption: keyof SearchSortOptions) {
  await searchStore.setSortOption(sortOption);

  router.push({
    name: "search",
    params: {
      searchId: searchStore.searchId,
    },
    query: {
      ...route.query,
      sort: sortOption, // TODO: handle query param
    },
  });
}

onMounted(() => {
  // set the initial tab based on the query param
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

// clear the search query when leaving this page
onBeforeRouteLeave(() => {
  searchStore.query = "";
});
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
