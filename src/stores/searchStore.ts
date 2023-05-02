import { defineStore } from "pinia";
import api from "@/api";
import { ref, computed, type Ref } from "vue";

import {
  FetchStatus,
  SearchResultMatch,
  SearchEntry,
  SearchResultsView,
} from "@/types";

export interface SearchStoreState {
  searchId: Ref<string | undefined>;
  status: Ref<FetchStatus>;
  query: Ref<string>;
  matches: Ref<SearchResultMatch[]>;
  totalResults: Ref<number | undefined>;
  currentPage: Ref<number>;
  searchEntry: Ref<SearchEntry | null>;
  resultsView: Ref<SearchResultsView>;
  beforeNewSearchHandlers: (() => void)[];
  afterNewSearchHandlers: ((state: SearchStoreState) => void)[];
}

const createState = (): SearchStoreState => ({
  searchId: ref<string | undefined>(undefined),
  status: ref<FetchStatus>("idle"),
  query: ref(""),
  matches: ref<SearchResultMatch[]>([]),
  totalResults: ref<number | undefined>(undefined),
  currentPage: ref(0),
  searchEntry: ref<SearchEntry | null>(null),
  resultsView: ref<SearchResultsView>("grid"),
  beforeNewSearchHandlers: [] as (() => void)[],
  afterNewSearchHandlers: [] as ((state: SearchStoreState) => void)[],
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
});

const actions = (state: SearchStoreState) => ({
  async search(searchId?: string): Promise<string | void> {
    // call all registered before handlers
    state.beforeNewSearchHandlers.forEach((fn) => fn());

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
        : await api.getSearchId(state.query.value).catch((err) => {
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

          // call all registered after handlers
          state.afterNewSearchHandlers.forEach((fn) => fn(state));
        })
        .catch((err) => {
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
