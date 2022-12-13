import { defineStore } from "pinia";
import api from "@/api";
import { ref, computed } from "vue";
import { FetchStatus, SearchResultMatch } from "@/types";

export const useSearchStore = defineStore("search", () => {
  const searchId = ref<string | null>(null);
  const status = ref<FetchStatus>("idle");
  const query = ref("");
  const matches = ref<SearchResultMatch[]>([]);
  const totalResults = ref(0);
  const currentPage = ref(0);

  async function search(searchText: string): Promise<string | void> {
    reset();
    query.value = searchText;
    status.value = "fetching";
    try {
      searchId.value = await api.getSearchId(query.value);
      searchById(searchId.value);
      return searchId.value;
    } catch (error) {
      console.error(error);
      status.value = "error";
    }
  }

  const hasMoreResults = computed(() => {
    return matches.value.length < totalResults.value;
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
      query.value = res.searchEntry.searchText ?? "";
      totalResults.value = res.totalResults;
      matches.value = res.matches;
      status.value = "success";
    } catch (error) {
      console.error(error);
      status.value = "error";
    }
  }

  function reset() {
    query.value = "";
    status.value = "idle";
    searchId.value = null;
    matches.value = [];
    totalResults.value = 0;
    currentPage.value = 0;
  }

  return {
    // expose refs as computed values to make readonly
    // readonly() was causing type issues for some reason
    matches: computed(() => matches.value),
    status: computed(() => status.value),
    searchId: computed(() => searchId.value),
    query: computed(() => query.value),
    totalResults: computed(() => totalResults.value),
    currentPage: computed(() => currentPage.value),
    hasMoreResults,
    search,
    searchById,
    loadMore,
    reset,
  };
});
