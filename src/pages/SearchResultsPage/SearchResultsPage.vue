<template>
  <DefaultLayout class="search-results-page">
    <template #custom-header>
      <CustomAppHeader v-if="instanceStore.customHeaderMode == 1" />
    </template>
    <div class="px-4">
      <SearchErrorNotification v-if="searchStore.status === 'error'" />
      <template v-else>
        <div class="flex justify-between items-center my-8">
          <BrowseCollectionHeader
            v-if="searchStore.browsingCollectionId"
            :collectionId="searchStore.browsingCollectionId" />
          <h2 v-else-if="searchStore.isReady" class="text-4xl font-bold">
            <q v-if="nonBrowsingPageTitle">{{ nonBrowsingPageTitle }}</q>
            <span v-else>Search Results</span>
          </h2>
          <Skeleton v-else class="!w-1/2 !h-12" />
        </div>

        <DidYouMeanSuggestions
          v-if="searchStore.isReady"
          :searchTerm="searchStore.currentSearchTerm" />

        <Tabs
          labelsClass="sticky top-14 z-20 search-results-page__tabs -mx-4 px-4 border-b border-neutral-200 pt-4"
          :activeTabId="searchStore.resultsView"
          @tabChange="handleTabChange">
          <div
            class="sm:flex justify-between items-center bg-transparent-black-50 rounded-md mb-4 p-2 flex-wrap">
            <ResultsCount
              class="mb-2 sm:mb-0"
              :fetchStatus="searchStore.status"
              :showingCount="searchStore.matches.length"
              :total="searchStore.totalResults ?? 0"
              @loadMore="searchStore.loadMore"
              @loadAll="searchStore.loadMore({ loadAll: true })" />
            <div v-if="searchStore.isReady" class="flex items-center">
              <SearchResultsSortSelect
                v-if="!['map', 'timeline'].includes(searchStore.resultsView)"
                :sortOptions="searchStore.sortOptions"
                :selectedSortOption="searchStore.sort"
                :searchQuery="
                  searchStore.searchEntry?.searchText ?? searchStore.query
                "
                class="mr-1"
                @sortOptionChange="handleSortOptionChange" />
              <AddSearchResultsToDrawerButton
                v-if="instanceStore.currentUser?.canManageDrawers" />

              <ShareButton
                v-if="
                  ['map', 'timeline', 'gallery'].includes(
                    searchStore.resultsView
                  )
                "
                :url="embedUrl" />
            </div>
          </div>
          <Tab id="grid" label="Grid">
            <SearchResultsGrid
              :totalResults="searchStore.totalResults"
              :matches="searchStore.matches"
              :status="searchStore.status"
              :showAddToDrawerButton="
                instanceStore.currentUser?.canManageDrawers
              "
              @loadMore="() => searchStore.loadMore()" />
          </Tab>
          <Tab id="list" label="List">
            <SearchResultsList
              :totalResults="searchStore.totalResults"
              :matches="searchStore.matches"
              :status="searchStore.status"
              @loadMore="() => searchStore.loadMore()" />
          </Tab>
          <Tab id="timeline" label="Timeline">
            <SearchResultsTimeline
              v-if="
                searchStore.totalResults && searchStore.status === 'success'
              "
              :totalResults="searchStore.totalResults"
              :matches="searchStore.matches"
              :status="searchStore.status"
              @loadMore="() => searchStore.loadMore()" />
          </Tab>
          <Tab id="map" label="Map">
            <SearchResultsMap
              v-if="searchStore.isReady"
              :totalResults="searchStore.totalResults"
              :matches="searchStore.matches"
              :status="searchStore.status"
              @loadMore="() => searchStore.loadMore()" />
          </Tab>
          <Tab id="gallery" label="Gallery">
            <SearchResultsGallery
              v-if="isNewSearchReadyForDisplay"
              :totalResults="searchStore.totalResults ?? Infinity"
              :matches="searchStore.matches"
              :status="searchStore.status"
              @loadMore="() => searchStore.loadMore()" />
          </Tab>

          <ResultsCount
            v-if="
              ['grid', 'list'].includes(searchStore.resultsView) &&
              (searchStore.totalResults ?? 0) > 6
            "
            class="mt-4"
            :fetchStatus="searchStore.status"
            :showingCount="searchStore.matches.length"
            :total="searchStore.totalResults ?? 0"
            @loadMore="searchStore.loadMore"
            @loadAll="searchStore.loadMore({ loadAll: true })" />
        </Tabs>
      </template>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { watch, computed, onMounted, nextTick, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useSearchStore } from "@/stores/searchStore";
import config from "@/config";
import BrowseCollectionHeader from "./BrowseCollectionHeader.vue";
import Tab from "@/components/Tabs/Tab.vue";
import Tabs from "@/components/Tabs/Tabs.vue";
import SearchResultsGrid from "@/components/SearchResultsGrid/SearchResultsGrid.vue";
import SearchResultsList from "@/components/SearchResultsList/SearchResultsList.vue";
import SearchResultsTimeline from "@/components/SearchResultsTimeline/SearchResultsTimeline.vue";
import SearchResultsMap from "@/components/SearchResultsMap/SearchResultsMap.vue";
import SearchResultsGallery from "@/components/SearchResultsGallery/SearchResultsGallery.vue";
import ResultsCount from "@/components/ResultsCount/ResultsCount.vue";
import CustomAppHeader from "@/components/CustomAppHeader/CustomAppHeader.vue";
import type {
  SearchResultsView,
  SearchSortOptions,
  Tab as TabType,
} from "@/types";
import { SEARCH_RESULTS_VIEWS, SORT_KEYS } from "@/constants/constants";
import SearchResultsSortSelect from "@/components/SearchResultsSortSelect/SearchResultsSortSelect.vue";
import SearchErrorNotification from "./SearchErrorNotification.vue";
import Skeleton from "@/components/Skeleton/Skeleton.vue";
import { useInstanceStore } from "@/stores/instanceStore";
import AddSearchResultsToDrawerButton from "./AddSearchResultsToDrawerButton.vue";
import DidYouMeanSuggestions from "./DidYouMeanSuggestions.vue";
import ShareButton from "@/components/ShareButton/ShareButton.vue";

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

const instanceStore = useInstanceStore();
const searchStore = useSearchStore();
const route = useRoute();
const router = useRouter();
const nonBrowsingPageTitle = computed(() => {
  return searchStore.searchEntry?.searchText ?? searchStore.query;
});
const BASE_URL = config.instance.base.url;
const embedUrl = computed(() => {
  return `${BASE_URL}/search/${props.resultsView}/${searchStore.searchId}`;
});

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

// load search results
watch(
  () => props.searchId,
  () => searchStore.search(props.searchId),
  { immediate: true }
);

type SearchViewTab = TabType & { id: SearchResultsView };

const isSearchViewTab = (tab: TabType): tab is SearchViewTab => {
  return SEARCH_RESULTS_VIEWS.includes(tab.id as SearchResultsView);
};

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
      sort: sortOption,
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
  [() => props.objectId, () => searchStore.status],
  ([objectId, status]) => {
    if (!objectId || status === "fetching") return;
    nextTick(() => {
      const el = document.getElementById(`object-${objectId}`);
      if (!el) return;

      el.scrollIntoView({
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
}
</style>
