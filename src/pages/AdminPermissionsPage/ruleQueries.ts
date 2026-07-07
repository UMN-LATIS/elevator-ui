import { queryOptions } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";

// Key scheme matches groupQueries: resource then kind, so item keys can
// branch off later without invalidating the lists.
export const makeRuleQueryKeyFor = {
  instanceGrantsList: () => ["instanceGrants", "list"] as const,
  collectionGrantsList: () => ["collectionGrants", "list"] as const,
  permissionLevels: () => ["permissionLevels"] as const,
};

export function instanceGrantsQuery() {
  return queryOptions({
    queryKey: makeRuleQueryKeyFor.instanceGrantsList(),
    queryFn: fetchers.fetchInstanceGrants,
  });
}

export function collectionGrantsQuery() {
  return queryOptions({
    queryKey: makeRuleQueryKeyFor.collectionGrantsList(),
    queryFn: fetchers.fetchCollectionGrants,
  });
}

export function permissionLevelsQuery() {
  return queryOptions({
    queryKey: makeRuleQueryKeyFor.permissionLevels(),
    queryFn: fetchers.fetchPermissionLevels,
    // Levels never change over a page's life, so fetch once and reuse.
    staleTime: Infinity,
  });
}
