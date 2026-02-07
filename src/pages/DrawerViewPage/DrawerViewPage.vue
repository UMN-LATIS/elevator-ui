<template>
  <DefaultLayout class="drawer-view-page">
    <template #custom-header>
      <CustomAppHeader v-if="instanceStore.customHeaderMode == 1" />
    </template>
    <div class="px-4">
      <Link
        :to="`/drawers/listDrawers`"
        class="flex items-center gap-1 mb-4 hover:no-underline mt-8">
        <ArrowForwardIcon class="transform rotate-180 h-4 w-4" />
        Back to Drawers
      </Link>
      <header class="my-8 flex flex-wrap items-center">
        <h2 class="text-4xl font-bold flex-grow">
          {{ drawerTitle }}
        </h2>
        <div
          v-if="instanceStore.currentUser?.canManageDrawers"
          class="flex items-center gap-2 bg-white p-1 rounded-md">
          <IconButton
            :href="`${BASE_URL}/permissions/edit/drawer/${drawerId}`"
            title="Edit Permissions">
            <UsersIcon class="!w-5 !h-5" />
            <span class="sr-only">Edit Permissions</span>
          </IconButton>
          <IconButton
            title="Download Drawer"
            :to="`/drawers/downloadDrawer/${drawerId}`">
            <DownloadIcon class="!w-5 !h-5" />
            <span class="sr-only">Download Drawer</span>
          </IconButton>
        </div>
      </header>

      <Tabs
        v-if="drawer"
        labelsClass="drawer-view-page__tabs sticky top-14 z-20  -mx-4 px-4 border-b border-outline pt-4"
        :activeTabId="activeTabId"
        @tabChange="handleTabChange">
        <div
          class="bg-outline-variant/20 rounded-md mb-4 sm:flex justify-between items-center p-2">
          <div>
            <ResultsCount
              v-if="drawer.contents"
              class="mb-2 sm:mb-0"
              :total="drawer.contents.totalResults"
              :fetchStatus="fetchStatus"
              :showingCount="drawer.contents.matches.length"
              @loadMore="handleLoadMore"
              @loadAll="handleLoadAll" />

            <div
              v-else
              class="flex items-center gap-2 text-on-surface-variant text-sm">
              <SpinnerIcon class="animate-spin h-5 w-5" />
              Loading...
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <label for="location" class="sr-only">Sort</label>
            <select
              id="sort"
              name="sort"
              class="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-on-surface ring-1 ring-inset ring-outline focus:ring-2 focus:ring-primary text-sm sm:leading-6 max-w-full bg-surface"
              :value="selectedSortOption"
              @change="handleSortOptionChange">
              <option
                v-for="(sortOptionLabel, sortOptionKey) in sortOptions"
                :key="sortOptionKey"
                :value="sortOptionKey">
                {{ sortOptionLabel }}
              </option>
            </select>
          </div>
        </div>
        <Tab id="grid" label="Grid">
          <Transition name="fade">
            <DrawerItemsGrid
              v-if="drawer.contents"
              :totalResults="drawer.contents.totalResults"
              :matches="drawer.contents.matches"
              :status="fetchStatus"
              :drawerId="drawerId"
              :isDraggable="
                selectedSortOption === SORT_KEYS.CUSTOM &&
                instanceStore.currentUser?.canManageDrawers
              "
              @dragEnd="handleDragEnd" />
          </Transition>
        </Tab>
        <Tab id="list" label="List">
          <Transition name="fade">
            <DrawerItemsList
              v-if="drawer.contents"
              :totalResults="drawer.contents.totalResults"
              :matches="drawer.contents.matches"
              :status="fetchStatus"
              :drawerId="drawerId"
              :isDraggable="
                selectedSortOption === SORT_KEYS.CUSTOM &&
                instanceStore.currentUser?.canManageDrawers
              "
              @dragEnd="handleDragEnd" />
          </Transition>
        </Tab>
        <Tab id="timeline" label="Timeline">
          <Transition name="fade">
            <SearchResultsTimeline
              v-if="drawer.contents"
              :totalResults="drawer.contents.totalResults"
              :matches="drawer.contents.matches"
              :status="fetchStatus" />
          </Transition>
        </Tab>
        <Tab id="map" label="Map">
          <Transition name="fade">
            <SearchResultsMap
              v-if="drawer.contents"
              :totalResults="drawer.contents.totalResults"
              :matches="drawer.contents.matches"
              :status="fetchStatus" />
          </Transition>
        </Tab>
        <Tab id="gallery" label="Gallery">
          <Transition name="fade">
            <SearchResultsGallery
              v-if="drawer.contents"
              :totalResults="drawer.contents.totalResults"
              :matches="drawer.contents.matches"
              :status="fetchStatus" />
          </Transition>
        </Tab>
      </Tabs>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import Tab from "@/components/Tabs/Tab.vue";
import Tabs from "@/components/Tabs/Tabs.vue";
import SearchResultsTimeline from "@/components/SearchResultsTimeline/SearchResultsTimeline.vue";
import SearchResultsMap from "@/components/SearchResultsMap/SearchResultsMap.vue";
import SearchResultsGallery from "@/components/SearchResultsGallery/SearchResultsGallery.vue";
import { ArrowForwardIcon, UsersIcon, DownloadIcon } from "@/icons";
import Link from "@/components/Link/Link.vue";
import ResultsCount from "@/components/ResultsCount/ResultsCount.vue";
import {
  SearchResultsView,
  Tab as TabType,
  FetchStatus,
  SearchResultMatch,
} from "@/types";
import { SEARCH_RESULTS_VIEWS } from "@/constants/constants";
import { useDrawerStore } from "@/stores/drawerStore";
import { SORT_KEYS } from "@/constants/constants";
import { useErrorStore } from "@/stores/errorStore";
import SpinnerIcon from "@/icons/SpinnerIcon.vue";
import DrawerItemsGrid from "./DrawerItemsGrid.vue";
import DrawerItemsList from "./DrawerItemsList.vue";
import IconButton from "@/components/IconButton/IconButton.vue";
import CustomAppHeader from "@/components/CustomAppHeader/CustomAppHeader.vue";
import { useInstanceStore } from "@/stores/instanceStore";
import config from "@/config";

const props = withDefaults(
  defineProps<{
    drawerId: number;
    resultsView?: SearchResultsView;
  }>(),
  {
    resultsView: "grid",
  }
);

const BASE_URL = config.instance.base.url;
const instanceStore = useInstanceStore();

const isValidResultsView = (view: string): view is SearchResultsView => {
  return SEARCH_RESULTS_VIEWS.includes(view as SearchResultsView);
};

const initialTab = isValidResultsView(props.resultsView)
  ? props.resultsView
  : "grid";
const activeTabId = ref<SearchResultsView>(initialTab);
const fetchStatus = ref<FetchStatus>("idle");

const drawerStore = useDrawerStore();
const router = useRouter();
const route = useRoute();
const drawer = computed(() => drawerStore.getDrawerById(props.drawerId));
const sortOptions = {
  [SORT_KEYS.TITLE]: "Default Title",
  [SORT_KEYS.CUSTOM]: "Custom",
};
const selectedSortOption = ref<keyof typeof sortOptions>(SORT_KEYS.TITLE);

const drawerTitle = computed(() => {
  return drawerStore.drawerRecords[props.drawerId]?.title;
});

type SearchViewTab = TabType & { id: SearchResultsView };
type supportedSortOption = keyof typeof sortOptions;

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

function handleDragEnd(updatedListOfItems: SearchResultMatch[]) {
  drawerStore.setDrawerItems(props.drawerId, updatedListOfItems);
}

function handleLoadMore() {
  console.log("load more");
}

function handleLoadAll() {
  console.log("load all");
}

const isValidSortOption = (sort: unknown): sort is supportedSortOption =>
  typeof sort === "string" && sort in sortOptions;

function handleSortOptionChange(event: Event) {
  const sortOption = (event.target as HTMLSelectElement).value;
  if (!isValidSortOption(sortOption)) {
    throw new Error(`Invalid sort option: ${sortOption}`);
  }

  selectedSortOption.value = sortOption;
  setSortQueryParam(sortOption);
  drawerStore.setDrawerSortBy(props.drawerId, sortOption);
}

function setSortQueryParam(sortOption: supportedSortOption) {
  router.replace({
    query: {
      ...route.query,
      sort: sortOption,
    },
  });
}
const errorStore = useErrorStore();

onMounted(async () => {
  fetchStatus.value = "fetching";
  // get current drawer contents
  const drawerRecord = await drawerStore.refreshDrawer(props.drawerId);

  // sortBy is persisted in the drawer record, so check its current value
  if (!drawerRecord?.contents) {
    fetchStatus.value = "error";
    return errorStore.setError(new Error("Couldn't find drawer content."));
  }

  // first check the query param for sort.
  // If it's invalid or empty,  just set it to match the drawer record
  if (!route.query.sort || !isValidSortOption(route.query.sort)) {
    selectedSortOption.value = drawerRecord.contents.sortBy ?? SORT_KEYS.TITLE;
    setSortQueryParam(selectedSortOption.value);
    fetchStatus.value = "success";
    return;
  }

  // if the query param is set, valid, and matches the drawer record
  // then just set the initial selected sort option
  if (route.query.sort === drawerRecord.contents.sortBy) {
    selectedSortOption.value = route.query.sort;
    fetchStatus.value = "success";
    return;
  }

  // finally, if the query param is set, valid, but
  // doesn't match the drawer record, then set the sortby option
  // and refresh the drawer contents
  selectedSortOption.value = route.query.sort;
  await drawerStore.setDrawerSortBy(props.drawerId, route.query.sort);

  fetchStatus.value = "success";
});
</script>
<style scoped></style>
<style>
.drawer-view-page__tabs {
  background: var(--surface);
}

.drawer-view-page .app-header {
  z-index: 30; /* keep app header dropdowns above tabs */
}
</style>
