import { defineStore } from "pinia";
import api from "@/api";
import { ref, reactive, computed, type Ref } from "vue";
import {
  FetchStatus,
  SearchResultMatch,
  SearchEntry,
  SearchResultsView,
  SearchSortOptions,
} from "@/types";
import { SORT_KEYS } from "@/constants/constants";

export interface SearchStoreState {
  searchId: Ref<string | undefined>;
  status: Ref<FetchStatus>;
  query: Ref<string>;
  filterBy: {
    collectionIds: number[];
  };
  matches: Ref<SearchResultMatch[]>;
  totalResults: Ref<number | undefined>;
  currentPage: Ref<number>;
  searchEntry: Ref<SearchEntry | null>;
  resultsView: Ref<SearchResultsView>;
  sortOptions: Ref<SearchSortOptions>;
  sort: Ref<keyof SearchSortOptions>;
  beforeNewSearchHandlers: (() => void)[];
  afterNewSearchHandlers: ((state: SearchStoreState) => void)[];
}

const defaultSortOptions: SearchSortOptions = {
  [SORT_KEYS.BEST_MATCH]: "Best Match",
  [SORT_KEYS.TITLE]: "Default Title",
  [SORT_KEYS.LAST_MODIFIED_ASC]: "Modified Date (oldest to newest)",
  [SORT_KEYS.LAST_MODIFIED_DESC]: "Modified Date (newest to oldest)",
};

const createState = (): SearchStoreState => ({
  searchId: ref(undefined),
  status: ref("idle"),
  query: ref(""),
  filterBy: reactive({
    collectionIds: [],
  }),
  matches: ref([]),
  totalResults: ref(undefined),
  currentPage: ref(0),
  searchEntry: ref(null),
  resultsView: ref("grid"),
  sortOptions: ref(defaultSortOptions),
  sort: ref(SORT_KEYS.BEST_MATCH),
  beforeNewSearchHandlers: [],
  afterNewSearchHandlers: [],
});

const getters = (state: SearchStoreState) => ({
  isReady: computed(() => state.status.value === "success"),
  hasMoreResults: computed(() => {
    return state.matches.value.length < (state.totalResults.value ?? 0);
  }),
  collectionIds: computed((): number[] | null => {
    if (!state.searchEntry.value?.collection) return null;
    // convert to numbers, as the api returns strings
    return state.searchEntry.value.collection.map((id) => Number.parseInt(id));
  }),
  isBrowsingCollection: computed((): boolean => {
    const collectionIds = getters(state).collectionIds.value;
    if (!collectionIds) return false;

    return (
      state.searchEntry.value?.searchText === "" && collectionIds.length === 1
    );
  }),
  browsingCollectionId: computed((): number | null => {
    const collectionIds = getters(state).collectionIds.value;
    const isBrowsingCollection = getters(state).isBrowsingCollection.value;

    if (!isBrowsingCollection || !collectionIds) return null;
    return collectionIds[0];
  }),
});

const actions = (state: SearchStoreState) => ({
  async setSortOption(option: keyof SearchSortOptions) {
    state.sort.value = option;

    // refresh search results
    return this.search();
  },

  addCollectionIdFilter(collectionId: number) {
    state.filterBy.collectionIds.push(collectionId);
  },

  removeCollectionIdFilter(collectionId: number) {
    const index = state.filterBy.collectionIds.indexOf(collectionId);

    if (index < 0) {
      throw new Error(
        `Cannot remove collection id ${collectionId} from searchStore. ID is not in filterBy.collectionIds`
      );
    }

    state.filterBy.collectionIds.splice(index, 1);
  },

  clearCollectionIdFilters() {
    state.filterBy.collectionIds = [];
  },

  async search(searchId?: string): Promise<string | void> {
    // call all registered before handlers
    state.beforeNewSearchHandlers.forEach((fn) => fn());

    // if we're searching a collection, make sure we have the collection id before clearing the searchEntry
    const collectionIds = getters(state).collectionIds.value;

    // clear old search results
    state.status.value = "fetching";
    state.searchId.value = undefined;
    state.matches.value = [];
    state.totalResults.value = undefined;
    state.currentPage.value = 0;
    state.searchEntry.value = null;

    try {
      // first get the id of the search for this query
      // if it's passed, use that
      state.searchId.value = searchId
        ? searchId
        : await api
            .getSearchId(state.query.value, {
              sort: state.sort.value ? state.sort.value : undefined,
              collections: getters(state).isBrowsingCollection
                ? collectionIds
                : undefined,
            })
            .catch((err) => {
              state.status.value = "error";
              throw new Error(
                `Cannot getSearchId for query: ${state.query}: ${err}`
              );
            });

      // async (don't await) get search results and update store
      // so that we can return the search id so they can redirect
      // if needed
      api
        .getSearchResultsById(state.searchId.value)
        .then((res) => {
          state.searchEntry.value = res.searchEntry;
          state.totalResults.value = res.totalResults;
          state.matches.value = res.matches;
          state.status.value = "success";
          state.sortOptions.value = res.sortableWidgets;

          // set query to the search text if it's not already set
          // to something. This handles the case when a user enters
          // the search results page with a search id in the url, but
          // nothing yet in the search input box
          state.query.value =
            state.query.value || res.searchEntry?.searchText || "";

          // call all registered after handlers
          state.afterNewSearchHandlers.forEach((fn) => fn(state));
        })
        .catch((err) => {
          state.status.value = "error";
          throw new Error(
            `Cannot getSearchResultsById for search id: ${state.searchId}: ${err}`
          );
        });
    } catch (error) {
      console.error(error);
      state.status.value = "error";

      // call all registered after handlers even if error
      state.afterNewSearchHandlers.forEach((fn) => fn(state));
    }

    return state.searchId.value;
  },

  // register a callback to be called when a new search is started
  onBeforeNewSearch(fn: () => void) {
    state.beforeNewSearchHandlers.push(fn);
  },

  // register a callback to be called when a new search is completed
  onAfterNewSearch(fn: (state: SearchStoreState) => void) {
    state.afterNewSearchHandlers.push(fn);
  },

  async loadMore({ loadAll } = { loadAll: false }) {
    if (!state.searchId.value) {
      throw new Error("No search id found. Cannot load more.");
    }

    if (!getters(state).hasMoreResults.value) {
      console.log("cannot load more results, already at the end");
      return;
    }

    state.status.value = "fetching";
    const prevPage = state.currentPage.value;
    try {
      state.currentPage.value = prevPage + 1;
      const res = await api.getSearchResultsById(
        state.searchId.value,
        state.currentPage.value,
        loadAll
      );
      state.matches.value.push(...res.matches);
      state.searchEntry.value = res.searchEntry;
      state.status.value = "success";
    } catch (error) {
      state.status.value = "error";
      // rollback page if error
      state.currentPage.value = prevPage;
      console.error(error);
    }
  },
  setResultsView(view: SearchResultsView) {
    state.resultsView.value = view;
  },
});

export const useSearchStore = defineStore("search", () => {
  const state = createState();
  const storeGetters = getters(state);
  const storeActions = actions(state);

  return {
    ...storeGetters,
    ...storeActions,
    ...state,
  };
});
