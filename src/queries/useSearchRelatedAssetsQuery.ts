import { useQuery } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { computed, toValue, type MaybeRefOrGetter } from "vue";
import { RELATED_ASSETS_SEARCH_QUERY_ID } from "./queryKeys";
import { SearchResultMatch } from "@/types";

export function useSearchRelatedAssetsQuery(
  {
    query = "",
    templateIds = [],
  }: {
    query: MaybeRefOrGetter<string>;
    templateIds?: MaybeRefOrGetter<number[]>;
  },
  options = {}
) {
  // convert the query to a ref to ensure reactivity
  const queryRef = computed(() => toValue(query).trim());
  const templateIdsRef = computed(() => toValue(templateIds));

  return useQuery({
    queryKey: [RELATED_ASSETS_SEARCH_QUERY_ID, templateIdsRef, queryRef],
    initialData: [],
    queryFn: async (): Promise<SearchResultMatch[]> => {
      const query = queryRef.value;
      const templateIds = templateIdsRef.value;

      if (!query) {
        return [];
      }

      const searchResult = await fetchers.fetchRelatedAssetSearchResults({
        query,
        templateIds,
      });

      return searchResult?.matches ?? [];
    },
    refetchOnWindowFocus: false,
    ...options,
  });
}
