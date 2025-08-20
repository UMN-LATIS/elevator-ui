import { useQuery } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { toRef, toValue, type MaybeRefOrGetter } from "vue";
import { SEARCH_QUERY_ID } from "./queryKeys";
import { SearchResultMatch } from "@/types";

export function useSearchAssetsQuery(
  query: MaybeRefOrGetter<string>,
  options: Record<string, unknown> = {}
) {
  // convert the query to a ref to ensure reactivity
  const queryRef = toRef(query);

  return useQuery({
    queryKey: [SEARCH_QUERY_ID, queryRef],
    initialData: [],
    queryFn: async (): Promise<SearchResultMatch[]> => {
      const searchQuery = toValue(query).trim();
      if (!searchQuery) {
        return [];
      }

      const searchResult = await fetchers.fetchSearchResults(searchQuery);

      return searchResult?.matches ?? [];
    },
    refetchOnWindowFocus: false,
    ...options,
  });
}
