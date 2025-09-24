import {
  Asset,
  SearchResultsResponse,
  SearchEntry,
  SearchResultMatch,
  SearchSortOptions,
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
    create: (query: string): SearchResultsResponse => {
      const searchId = crypto.randomUUID();

      // find any matches in the assets
      const allAssets = assets.getAll();

      // not a real search
      // just stringify the assets and filter by the query
      const matchedAssets = allAssets.filter(stupidSearch(query));
      const allSearchMatches = matchedAssets.map((asset) => {
        const collection = collections.get(asset.collectionId);
        const template = templates.get(asset.templateId);
        if (!collection || !template) {
          throw new Error(
            `Collection or template not found for asset ${asset.assetId}`
          );
        }

        return assetToSearchResultMatch({ asset, collection, template });
      });

      const searchEntry = {
        searchText: query,
        combineSpecificSearches: "OR" as const,
      };

      const sortableWidgets = {
        [SORT_KEYS.BEST_MATCH]: "Best Match" as const,
        [SORT_KEYS.TITLE]: "Default Title" as const,
        [SORT_KEYS.LAST_MODIFIED_DESC]:
          "Modified Date (newest to oldest)" as const,
        [SORT_KEYS.LAST_MODIFIED_ASC]:
          "Modified Date (oldest to newest)" as const,
      };

      // Store complete results for pagination
      completeSearchResults.set(searchId, {
        allMatches: allSearchMatches,
        totalResults: matchedAssets.length,
        searchEntry,
        sortableWidgets,
      });

      // Return only first page (30 results max)
      const paginatedMatches = allSearchMatches.slice(0, MAX_RESULTS_PER_PAGE);

      const newSearch: SearchResultsResponse = {
        searchId,
        matches: paginatedMatches,
        totalResults: matchedAssets.length,
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
