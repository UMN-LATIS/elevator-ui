<template>
  <DefaultLayout class="drawer-view-page">
    <Transition name="fade">
      <div v-if="drawer.contents" class="px-4">
        <header class="my-8">
          <Link
            :to="`/drawers/listDrawers`"
            class="flex items-center gap-1 mb-4"
          >
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
          <div class="bg-transparent-black-50 rounded-md mb-4">
            <ResultsCount
              class="mb-2 sm:mb-0 p-2"
              :total="drawer.contents.totalResults"
              :fetchStatus="fetchStatus"
              :showingCount="drawer.contents.matches.length"
              @loadMore="handleLoadMore"
              @loadAll="handleLoadAll"
            />
          </div>
          <Tab id="grid" label="Grid">
            <SearchResultsGrid
              :totalResults="drawer.contents.totalResults"
              :matches="drawer.contents.matches"
              :status="fetchStatus"
              :drawerId="drawerId"
            />
          </Tab>
          <Tab id="list" label="List">
            <SearchResultsList
              :totalResults="drawer.contents.totalResults"
              :matches="drawer.contents.matches"
              :status="fetchStatus"
            />
          </Tab>
          <Tab id="timeline" label="Timeline">
            <SearchResultsTimeline
              :totalResults="drawer.contents.totalResults"
              :matches="drawer.contents.matches"
              :status="fetchStatus"
            />
          </Tab>
          <Tab id="map" label="Map">
            <SearchResultsMap
              :totalResults="drawer.contents.totalResults"
              :matches="drawer.contents.matches"
              :status="fetchStatus"
            />
          </Tab>
          <Tab id="gallery" label="Gallery">
            <SearchResultsGallery
              :totalResults="drawer.contents.totalResults"
              :matches="drawer.contents.matches"
              :status="fetchStatus"
            />
          </Tab>
        </Tabs>
      </div>
    </Transition>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
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
import ResultsCount from "@/components/ResultsCount/ResultsCount.vue";
import { SearchResultsView, Tab as TabType, FetchStatus } from "@/types";
import { SEARCH_RESULTS_VIEWS } from "@/constants/constants";
import { useDrawerStore } from "@/stores/drawerStore";

const props = withDefaults(
  defineProps<{
    drawerId: number;
    resultsView?: SearchResultsView;
  }>(),
  {
    resultsView: undefined,
  }
);

const activeTabId = ref<SearchResultsView>("grid");
const fetchStatus = ref<FetchStatus>("idle");

const drawerStore = useDrawerStore();
const router = useRouter();
const route = useRoute();
const drawer = computed(() => drawerStore.getDrawerById(props.drawerId));

const drawerTitle = computed(() => {
  return drawerStore.drawers.find((d) => d.id === props.drawerId)?.title;
});

type SearchViewTab = TabType & { id: SearchResultsView };
const isValidTab = (tab: TabType): tab is SearchViewTab => {
  return SEARCH_RESULTS_VIEWS.includes(tab.id as SearchResultsView);
};

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

function handleLoadMore() {
  console.log("load more");
}

function handleLoadAll() {
  console.log("load all");
}

onMounted(async () => {
  fetchStatus.value = "fetching";
  await drawerStore.refreshDrawer(props.drawerId);
  fetchStatus.value = "success";
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
