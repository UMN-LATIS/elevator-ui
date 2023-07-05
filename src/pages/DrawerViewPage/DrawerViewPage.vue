<template>
  <DefaultLayout class="drawer-view-page">
    <ConfirmModal
      :isOpen="!!objectIdToRemove"
      :title="`Remove from drawer`"
      type="danger"
      confirmLabel="Remove"
      @close="objectIdToRemove = null"
      @confirm="handleRemoveFromDrawer"
    >
      Are you sure you want to remove
      <b>{{ objectToRemove?.title ?? "this asset" }}</b> from the drawer
      <b>{{ drawerTitle }}</b
      >?
    </ConfirmModal>
    <Transition name="fade">
      <div v-if="fetchStatus === 'success'" class="px-4">
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
              :total="totalResults"
              :fetchStatus="fetchStatus"
              :showingCount="results.length"
              @loadMore="handleLoadMore"
              @loadAll="handleLoadAll"
            />
          </div>
          <Tab id="grid" label="Grid">
            <SearchResultsGrid
              :totalResults="results.length"
              :matches="results"
              :status="fetchStatus"
              :drawerId="drawerId"
              :showRemoveButton="instanceStore.currentUser?.canManageDrawers"
              @remove="confirmRemoveFromDrawer"
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
    </Transition>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
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
import {
  SearchResultsView,
  Tab as TabType,
  FetchStatus,
  SearchResultMatch,
} from "@/types";
import { SEARCH_RESULTS_VIEWS } from "@/constants/constants";
import api from "@/api";
import { useInstanceStore } from "@/stores/instanceStore";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal.vue";
import { useToastStore } from "@/stores/toastStore";

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
const totalResults = ref(0);
const objectIdToRemove = ref<string | null>(null);
const objectToRemove = computed(() => {
  return results.value.find(
    (result) => result.objectId === objectIdToRemove.value
  );
});

const instanceStore = useInstanceStore();
const toastStore = useToastStore();

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

function handleLoadMore() {
  console.log("load more");
}

function handleLoadAll() {
  console.log("load all");
}

function confirmRemoveFromDrawer(objectId: string) {
  objectIdToRemove.value = objectId;
}

async function handleRemoveFromDrawer() {
  // cache the object to remove
  const removedObject = objectToRemove.value;
  if (!removedObject) throw new Error("No object to remove");

  // optimistically update
  results.value = results.value.filter(
    (result) => result.objectId !== removedObject.objectId
  );
  totalResults.value = totalResults.value - 1;
  objectIdToRemove.value = null;

  fetchStatus.value = "fetching";
  await api.removeAssetFromDrawer({
    drawerId: props.drawerId,
    assetId: removedObject.objectId,
  });
  fetchStatus.value = "success";

  toastStore.addToast(
    `Removed ${removedObject.title} from ${drawerTitle.value} drawer`
  );
}

onMounted(async () => {
  fetchStatus.value = "fetching";
  const data = await api.getDrawer(props.drawerId);
  drawerTitle.value = data.drawerTitle;
  results.value = data.matches;
  totalResults.value = data.totalResults;
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
