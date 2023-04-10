import { defineStore } from "pinia";
import api from "@/api";
import { ref, computed } from "vue";
import { FetchStatus, SearchResultMatch, SearchEntry } from "@/types";

export const useSearchStore = defineStore("search", () => {
  const searchId = ref<string | undefined>(undefined);
  const status = ref<FetchStatus>("idle");
  const query = ref("");
  const matches = ref<SearchResultMatch[]>([]);
  const totalResults = ref<number | undefined>(undefined);
  const currentPage = ref(0);
  const searchEntry = ref<SearchEntry | null>(null);
  const isReady = computed(() => status.value === "success");

  async function search(): Promise<string | void> {
    // clear old search results
    status.value = "fetching";
    searchId.value = undefined;
    matches.value = [];
    totalResults.value = undefined;
    currentPage.value = 0;
    searchEntry.value = null;
    try {
      // first get the id of the search for this query
      searchId.value = await api.getSearchId(query.value);

      // then use the id to get the actual results
      searchById(searchId.value);
      return searchId.value;
    } catch (error) {
      console.error(error);
      status.value = "error";
    }
  }

  const hasMoreResults = computed(() => {
    return matches.value.length < (totalResults.value ?? 0);
  });

  async function loadMore() {
    if (!searchId.value) {
      throw new Error(
        "No search id found. Did you forget to call search() or searchById() first?"
      );
    }

    if (!hasMoreResults.value) {
      console.log("cannot load more results, already at the end");
      return;
    }

    status.value = "fetching";
    const prevPage = currentPage.value;
    try {
      currentPage.value = prevPage + 1;
      const res = await api.getSearchResultsById(
        searchId.value,
        currentPage.value
      );
      matches.value.push(...res.matches);
      searchEntry.value = res.searchEntry;
      status.value = "success";
    } catch (error) {
      status.value = "error";
      // rollback page if error
      currentPage.value = prevPage;
      console.error(error);
    }
  }

  async function searchById(id: string) {
    currentPage.value = 0;
    searchId.value = id;
    status.value = "fetching";

    try {
      const res = await api.getSearchResultsById(id);

      searchEntry.value = res.searchEntry;
      totalResults.value = res.totalResults;
      matches.value = res.matches;
      status.value = "success";
    } catch (error) {
      console.error(error);
      status.value = "error";
    }
  }

  return {
    // expose refs as computed values to make readonly
    // readonly() was causing type issues for some reason
    query,
    matches: computed(() => matches.value),
    status: computed(() => status.value),
    searchId: computed(() => searchId.value),
    totalResults: computed(() => totalResults.value),
    currentPage: computed(() => currentPage.value),
    searchEntry: computed(() => searchEntry.value),
    collectionIds: computed((): number[] | null => {
      if (!searchEntry.value?.collection) return null;
      // convert to numbers, as the api returns strings
      return searchEntry.value.collection.map(Number.parseInt);
    }),
    hasMoreResults,
    search,
    searchById,
    loadMore,
    isReady,
  };
});
