import {
  Asset,
  SearchResultsResponse,
  SearchEntry,
  SearchResultMatch,
  SearchSortOptions,
  SpecificFieldSearchItem,
} from "../../src/types";
import { SORT_KEYS } from "../../src/constants/constants";
import { assetToSearchResultMatch } from "../utils/assetToSearchResultMatch";
import { createBaseTable } from "./baseTable";
import type { CollectionsTable } from "./collections";
import type { TemplatesTable } from "./templates";
import type { AssetsTable } from "./assets";

const stupidSearch = (query: string) => (asset: Asset) => {
  const lowerQuery = query.toLowerCase();
  const assetString = JSON.stringify(asset).toLowerCase();
  return assetString.includes(lowerQuery);
};

const MAX_RESULTS_PER_PAGE = 30;

export function createSearchesTable({
  assets,
  collections,
  templates,
}: {
  assets: AssetsTable;
  collections: CollectionsTable;
  templates: TemplatesTable;
}) {
  const baseTable = createBaseTable(
    (search: SearchResultsResponse) => search.searchId,
    [] // Empty seed data - searches are created dynamically
  );

  // Store complete search results for pagination
  const completeSearchResults = new Map<
    string,
    {
      allMatches: SearchResultMatch[];
      totalResults: number;
      searchEntry: SearchEntry;
      sortableWidgets: SearchSortOptions;
    }
  >();

  return {
    ...baseTable,
    // Table-specific methods
    create: (
      query: string,
      {
        totalResultsOverride,
        specificFieldSearch,
        collectionIds = [],
      }: {
        totalResultsOverride?: number;
        specificFieldSearch?: SpecificFieldSearchItem[];
        collectionIds?: number[];
      } = {}
    ): SearchResultsResponse => {
      const searchId = crypto.randomUUID();

      // find any matches in the assets
      const allAssets = assets.getAll();

      // a collection search sweeps that collection and everything under
      // it. No ids means every collection.
      const searchedCollectionIds = collectionIds.length
        ? new Set(
            collectionIds.flatMap((collectionId) =>
              collections.getSubtreeIds(collectionId)
            )
          )
        : null;

      // not a real search
      // just stringify the assets and filter by the query
      const matchesQuery = stupidSearch(query);
      const matchedAssets = allAssets.filter((asset) => {
        if (
          searchedCollectionIds &&
          !searchedCollectionIds.has(asset.collectionId)
        ) {
          return false;
        }
        return matchesQuery(asset);
      });
      const allSearchMatches = matchedAssets.flatMap((asset) => {
        const template = templates.get(asset.templateId);
        if (!template) return [];

        // an asset outlives the collection it was in, and keeps its
        // place in the results with an empty hierarchy
        const collection = collections.get(asset.collectionId);

        return [assetToSearchResultMatch({ asset, collection, template })];
      });

      const searchEntry: SearchEntry = {
        searchText: query,
        combineSpecificSearches: "OR" as const,
        ...(specificFieldSearch ? { specificFieldSearch } : {}),
      };

      const sortableWidgets = {
        [SORT_KEYS.BEST_MATCH]: "Best Match" as const,
        [SORT_KEYS.TITLE]: "Default Title" as const,
        [SORT_KEYS.LAST_MODIFIED_DESC]:
          "Modified Date (newest to oldest)" as const,
        [SORT_KEYS.LAST_MODIFIED_ASC]:
          "Modified Date (oldest to newest)" as const,
      };

      // permit override for testing when there's a mismatch between the number of matched assets and the expected total results (e.g. when testing pagination)
      const totalResults = totalResultsOverride ?? allSearchMatches.length;

      // Store complete results for pagination
      completeSearchResults.set(searchId, {
        allMatches: allSearchMatches,
        totalResults,
        searchEntry,
        sortableWidgets,
      });

      // Return only first page (30 results max)
      const paginatedMatches = allSearchMatches.slice(0, MAX_RESULTS_PER_PAGE);

      const newSearch: SearchResultsResponse = {
        searchId,
        matches: paginatedMatches,
        totalResults,
        searchResults: paginatedMatches.map((match) => match.objectId),
        searchEntry,
        sortableWidgets,
      };

      baseTable.set(searchId, newSearch);
      return newSearch;
    },

    // New method to get paginated results
    getPage: (
      searchId: string,
      page: number = 0,
      loadAll: boolean = false
    ): SearchResultsResponse | null => {
      const completeResults = completeSearchResults.get(searchId);
      if (!completeResults) {
        return null;
      }

      const { allMatches, totalResults, searchEntry, sortableWidgets } =
        completeResults;

      let paginatedMatches: SearchResultMatch[];

      const startIndex = page * MAX_RESULTS_PER_PAGE;
      const endIndex = loadAll ? undefined : startIndex + MAX_RESULTS_PER_PAGE;
      paginatedMatches = allMatches.slice(startIndex, endIndex);

      const paginatedSearch: SearchResultsResponse = {
        searchId,
        matches: paginatedMatches,
        totalResults,
        searchResults: paginatedMatches.map((match) => match.objectId),
        searchEntry,
        sortableWidgets,
      };

      // Update stored result with paginated data
      baseTable.set(searchId, paginatedSearch);
      return paginatedSearch;
    },
  };
}

export type SearchesTable = ReturnType<typeof createSearchesTable>;
