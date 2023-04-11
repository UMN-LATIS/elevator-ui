import { defineStore } from "pinia";
import api from "@/api";
import { ref, computed } from "vue";
import { FetchStatus, SearchResultMatch, SearchEntry } from "@/types";

const createState = () => ({
  searchId: ref<string | undefined>(undefined),
  status: ref<FetchStatus>("idle"),
  query: ref(""),
  matches: ref<SearchResultMatch[]>([]),
  totalResults: ref<number | undefined>(undefined),
  currentPage: ref(0),
  searchEntry: ref<SearchEntry | null>(null),
});

const getters = (state: ReturnType<typeof createState>) => ({
  isReady: computed(() => state.status.value === "success"),
  hasMoreResults: computed(() => {
    return state.matches.value.length < (state.totalResults.value ?? 0);
  }),
  collectionIds: computed((): number[] | null => {
    if (!state.searchEntry.value?.collection) return null;
    // convert to numbers, as the api returns strings
    return state.searchEntry.value.collection.map((id) => Number.parseInt(id));
  }),
  matches: computed(() => state.matches.value),
  status: computed(() => state.status.value),
  searchId: computed(() => state.searchId.value),
  totalResults: computed(() => state.totalResults.value),
  currentPage: computed(() => state.currentPage.value),
  searchEntry: computed(() => state.searchEntry.value),
});

const actions = (state: ReturnType<typeof createState>) => ({
  async search(): Promise<string | void> {
    // clear old search results
    state.status.value = "fetching";
    state.searchId.value = undefined;
    state.matches.value = [];
    state.totalResults.value = undefined;
    state.currentPage.value = 0;
    state.searchEntry.value = null;
    try {
      // first get the id of the search for this query
      state.searchId.value = await api.getSearchId(state.query.value);

      // then use the id to get the actual results
      actions(state).searchById(state.searchId.value);
      return state.searchId.value;
    } catch (error) {
      console.error(error);
      state.status.value = "error";
    }
  },
  async loadMore() {
    if (!state.searchId.value) {
      throw new Error(
        "No search id found. Did you forget to call search() or searchById() first?"
      );
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
        state.currentPage.value
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
  async searchById(id: string) {
    state.currentPage.value = 0;
    state.searchId.value = id;
    state.status.value = "fetching";

    try {
      const res = await api.getSearchResultsById(id);

      state.searchEntry.value = res.searchEntry;
      state.totalResults.value = res.totalResults;
      state.matches.value = res.matches;
      state.status.value = "success";
    } catch (error) {
      console.error(error);
      state.status.value = "error";
    }
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
