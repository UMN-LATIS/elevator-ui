<template>
  <DefaultLayout class="drawer-view-page">
    <div class="px-4">
      <h2 class="text-4xl my-8 font-bold">Drawer Title</h2>

      <Tabs
        labelsClass="drawer-view-page__tabs sticky top-14 z-20  -mx-4 px-4 border-b border-neutral-200 pt-4"
        :activeTabId="activeTabId"
        @tabChange="handleTabChange"
      >
        <Tab id="grid" label="Grid">
          <SearchResultsGrid
            :totalResults="results.length"
            :matches="results"
            :status="fetchStatus"
          />
        </Tab>
        <Tab id="list" label="List">
          <SearchResultsList
            :totalResults="results.length"
            :matches="results"
            :status="fetchStatus"
          />
        </Tab>
        <!-- <Tab id="timeline" label="Timeline">
          <SearchResultsTimeline
            :totalResults="results.length"
            :matches="results"
            :status="fetchStatus"
          />
        </Tab>
        <Tab id="map" label="Map">
          <SearchResultsMap
            :totalResults="results.length"
            :matches="results"
            :status="fetchStatus"
          />
        </Tab>
        <Tab id="gallery" label="Gallery">
          <SearchResultsGallery
            :totalResults="results.length"
            :matches="results"
            :status="fetchStatus"
          />
        </Tab> -->
      </Tabs>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import Tab from "@/components/Tabs/Tab.vue";
import Tabs from "@/components/Tabs/Tabs.vue";
import SearchResultsGrid from "@/components/SearchResultsGrid/SearchResultsGrid.vue";
import SearchResultsList from "@/components/SearchResultsList/SearchResultsList.vue";
import type { SearchResultsView, Tab as TabType, FetchStatus } from "@/types";
import { SEARCH_RESULTS_VIEWS } from "@/constants/constants";

withDefaults(
  defineProps<{
    drawerId: number;
    resultsView?: SearchResultsView;
  }>(),
  {
    resultsView: undefined,
  }
);

const activeTabId = ref<SearchResultsView>("grid");
const results = ref([]);
const fetchStatus = ref<FetchStatus>("idle");

type SearchViewTab = TabType & { id: SearchResultsView };
const isValidTab = (tab: TabType): tab is SearchViewTab => {
  return SEARCH_RESULTS_VIEWS.includes(tab.id as SearchResultsView);
};

const router = useRouter();
const route = useRoute();
function handleTabChange(tab: TabType) {
  if (!isValidTab(tab)) throw new Error(`Invalid tab id: ${tab.id}`);

  activeTabId.value = tab.id;

  // update the url query param to match state
  router.replace({
    query: {
      ...route.query,
      resultsView: tab.id,
    },
  });
}
</script>
<style scoped></style>
<style>
.drawer-view-page__tabs {
  background: var(--app-backgroundColor);
}

.drawer-view-page .app-header {
  z-index: 30; /* keep app header dropdowns above tabs */
  border-bottom-color: transparent !important;
}
</style>
