<template>
  <Tabs
    labelsClass="sticky top-14 z-20 search-results-page__tabs -mx-4 px-4 border-b border-neutral-200 pt-4"
    :activeTabId="activeTabId"
    @tabChange="$emit('tabChange', $event)"
  >
    <slot />
    <Tab id="grid" v-slot="{ isActiveTab }" label="Grid">
      <Transition name="fade">
        <SearchResultsGrid
          v-show="isActiveTab"
          :totalResults="totalResults"
          :matches="matches"
          :status="fetchStatus"
          :showAddToDrawerButton="showAddToDrawerButton"
          @loadMore="$emit('loadMore')"
        />
      </Transition>
    </Tab>
    <Tab id="list" v-slot="{ isActiveTab }" label="List">
      <Transition name="fade">
        <SearchResultsList
          v-show="isActiveTab"
          :totalResults="totalResults"
          :matches="matches"
          :status="fetchStatus"
          @loadMore="$emit('loadMore')"
        />
      </Transition>
    </Tab>
    <!-- <Tab id="timeline" label="Timeline" :unmountWhenInactive="true">
      <SearchResultsTimeline
        v-if="totalResults && fetchStatus === 'success'"
        :totalResults="totalResults"
        :matches="matches"
        :status="fetchStatus"
        @loadMore="$emit('loadMore')"
      />
    </Tab>
    <Tab id="map" label="Map" :unmountWhenInactive="true">
      <SearchResultsMap
        :totalResults="totalResults"
        :matches="matches"
        :status="fetchStatus"
        @loadMore="$emit('loadMore')"
      />
    </Tab>
    <Tab id="gallery" label="Gallery" :unmountWhenInactive="true">
      <SearchResultsGallery
        :totalResults="totalResults ?? Infinity"
        :matches="matches"
        :status="fetchStatus"
        @loadMore="$emit('loadMore')"
      />
    </Tab> -->

    <slot name="bottom" />
  </Tabs>
</template>
<script setup lang="ts">
import Tab from "@/components/Tabs/Tab.vue";
import Tabs from "@/components/Tabs/Tabs.vue";
import { FetchStatus, SearchResultMatch, Tab as TabType } from "@/types";
import SearchResultsGrid from "@/components/SearchResultsGrid/SearchResultsGrid.vue";
import SearchResultsList from "@/components/SearchResultsList/SearchResultsList.vue";
import SearchResultsMap from "@/components/SearchResultsMap/SearchResultsMap.vue";
import SearchResultsGallery from "@/components/SearchResultsGallery/SearchResultsGallery.vue";
import SearchResultsTimeline from "@/components/SearchResultsTimeline/SearchResultsTimeline.vue";

withDefaults(
  defineProps<{
    activeTabId: string;
    fetchStatus: FetchStatus;
    matches: SearchResultMatch[];
    totalResults?: number;
    showAddToDrawerButton?: boolean;
  }>(),
  {
    totalResults: 0,
    showAddToDrawerButton: false,
  }
);

defineEmits<{
  (eventName: "tabChange", tab: TabType): void;
  (eventName: "loadMore"): void;
  (eventName: "loadAll"): void;
}>();
</script>
<style scoped>
.search-results-page__tabs {
  background: var(--app-backgroundColor);
}

.search-results-page .app-header {
  z-index: 30; /* keep app header dropdowns above tabs */
}
</style>
