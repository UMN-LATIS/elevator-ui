import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";

vi.mock("@/api", () => ({
  default: {
    getSearchId: vi.fn().mockResolvedValue("search-id-sorted"),
    getSearchResultsById: vi.fn().mockResolvedValue({
      searchEntry: {
        searchText: "test",
        sort: "title.raw",
        combineSpecificSearches: "AND",
        collection: [],
        specificFieldSearch: [],
      },
      totalResults: 1,
      matches: [{ objectId: "abc123" }],
      sortableWidgets: {
        0: "Best Match",
        "title.raw": "Default Title",
      },
    }),
  },
}));

vi.mock("@/config", () => ({
  default: {
    instance: {
      autoloadMaxSearchResults: false,
    },
  },
}));

vi.mock("@/stores/instanceStore", () => ({
  useInstanceStore: () => ({
    getSearchableField: () => null,
  }),
}));

describe("searchStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe("setSortOption", () => {
    it("fetches new results even when results already exist", async () => {
      const { default: api } = await import("@/api");
      const { useSearchStore } = await import("@/stores/searchStore");
      const { SORT_KEYS } = await import("@/constants/constants");
      const store = useSearchStore();

      // Simulate an existing search with results already loaded
      store.searchId = "search-id-original";
      store.matches = [{ objectId: "existing" } as never];
      store.totalResults = 1;
      store.status = "success";
      store.query = "test";

      // Change sort option — this should fetch new results
      await store.setSortOption(SORT_KEYS.TITLE);

      // getSearchId should be called to get the new search ID
      expect(api.getSearchId).toHaveBeenCalled();

      // getSearchResultsById should be called with the new search ID.
      // This fails on the current code: setSortOption pre-stores the
      // searchId in state, so search()'s dedup guard sees a match
      // and skips the fetch entirely.
      expect(api.getSearchResultsById).toHaveBeenCalledWith(
        "search-id-sorted",
        expect.objectContaining({ page: 0 }),
      );
    });
  });
});
