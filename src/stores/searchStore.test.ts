import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import type { SearchResultMatch } from "@/types";

const makeMatch = (
  overrides: Partial<SearchResultMatch> = {},
): SearchResultMatch => ({
  title: "Test Asset",
  dates: [],
  locations: [],
  objectId: "test-id",
  collectionHierarchy: [],
  template: { id: 1, name: "Test Template" },
  ...overrides,
});

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
      matches: [
        {
          title: "Result",
          dates: [],
          locations: [],
          objectId: "abc123",
          collectionHierarchy: [],
          template: { id: 1, name: "T" },
        },
      ],
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

// Dynamic imports are needed because vi.mock is hoisted above static
// imports, and the store/api modules must resolve with mocks in place.
async function importModules() {
  const { default: api } = await import("@/api");
  const { useSearchStore } = await import("@/stores/searchStore");
  const { SORT_KEYS } = await import("@/constants/constants");
  return { api, useSearchStore, SORT_KEYS };
}

describe("searchStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe("setSortOption", () => {
    it("fetches new results even when results already exist", async () => {
      const { api, useSearchStore, SORT_KEYS } = await importModules();
      const store = useSearchStore();

      // Simulate an existing search with results already loaded
      store.searchId = "search-id-original";
      store.matches = [makeMatch({ objectId: "existing" })];
      store.totalResults = 1;
      store.status = "success";
      store.query = "test";

      await store.setSortOption(SORT_KEYS.TITLE);

      expect(api.getSearchId).toHaveBeenCalled();
      expect(api.getSearchResultsById).toHaveBeenCalledWith(
        "search-id-sorted",
        expect.objectContaining({ page: 0 }),
      );
      expect(store.searchId).toBe("search-id-sorted");
    });

    it("fetches results when no prior results exist", async () => {
      const { api, useSearchStore, SORT_KEYS } = await importModules();
      const store = useSearchStore();

      store.query = "test";

      await store.setSortOption(SORT_KEYS.TITLE);

      expect(api.getSearchId).toHaveBeenCalled();
      expect(api.getSearchResultsById).toHaveBeenCalledWith(
        "search-id-sorted",
        expect.objectContaining({ page: 0 }),
      );
    });
  });
});
