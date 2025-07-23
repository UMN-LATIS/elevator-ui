import { Asset, SearchResultsResponse } from "../../src/types";
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
      const searchMatches = matchedAssets.map((asset) => {
        const collection = collections.get(asset.collectionId);
        const template = templates.get(asset.templateId);
        if (!collection || !template) {
          throw new Error(
            `Collection or template not found for asset ${asset.assetId}`
          );
        }

        return assetToSearchResultMatch({ asset, collection, template });
      });

      const newSearch: SearchResultsResponse = {
        searchId,
        matches: searchMatches,
        totalResults: matchedAssets.length,
        searchResults: matchedAssets.map((asset) => asset.assetId),
        searchEntry: {
          searchText: query,
          combineSpecificSearches: "OR",
        },
        sortableWidgets: {
          [SORT_KEYS.BEST_MATCH]: "Best Match",
          [SORT_KEYS.TITLE]: "Default Title",
          [SORT_KEYS.LAST_MODIFIED_DESC]: "Modified Date (newest to oldest)",
          [SORT_KEYS.LAST_MODIFIED_ASC]: "Modified Date (oldest to newest)",
        },
      };

      baseTable.set(searchId, newSearch);
      return newSearch;
    },
  };
}

export type SearchesTable = ReturnType<typeof createSearchesTable>;
