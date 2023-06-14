<template>
  <DefaultLayout class="drawer-view-page">
    <div class="px-4">
      <header class="my-8">
        <Link :to="`/drawers/listDrawers`" class="flex items-center gap-1 mb-4">
          <ArrowForwardIcon class="transform rotate-180 h-4 w-4" />
          Back to Drawers
        </Link>
        <h2 class="text-4xl font-bold">{{ drawerTitle }}</h2>
      </header>

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
        <Tab id="timeline" label="Timeline">
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
        </Tab>
      </Tabs>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import Tab from "@/components/Tabs/Tab.vue";
import Tabs from "@/components/Tabs/Tabs.vue";
import SearchResultsGrid from "@/components/SearchResultsGrid/SearchResultsGrid.vue";
import SearchResultsList from "@/components/SearchResultsList/SearchResultsList.vue";
import SearchResultsTimeline from "@/components/SearchResultsTimeline/SearchResultsTimeline.vue";
import SearchResultsMap from "@/components/SearchResultsMap/SearchResultsMap.vue";
import SearchResultsGallery from "@/components/SearchResultsGallery/SearchResultsGallery.vue";
import ArrowForwardIcon from "@/icons/ArrowForwardIcon.vue";
import Link from "@/components/Link/Link.vue";
import {
  SearchResultsView,
  Tab as TabType,
  FetchStatus,
  SearchResultMatch,
} from "@/types";
import { SEARCH_RESULTS_VIEWS } from "@/constants/constants";
import api from "@/api";

const props = withDefaults(
  defineProps<{
    drawerId: number;
    resultsView?: SearchResultsView;
  }>(),
  {
    resultsView: undefined,
  }
);

const drawerTitle = ref("");
const activeTabId = ref<SearchResultsView>("grid");
const results = ref<SearchResultMatch[]>([]);
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

onMounted(async () => {
  const data = await api.getDrawer(props.drawerId);
  drawerTitle.value = data.drawerTitle;
  results.value = data.matches;
});
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
