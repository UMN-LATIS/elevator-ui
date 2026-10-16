import { useQuery } from "@tanstack/vue-query";
import { fetchCollectionDescription } from "@/api/fetchers";
import { toValue, type MaybeRefOrGetter } from "vue";
import { COLLECTIONS_QUERY_KEY, VIEW } from "./queryKeys";

export function collectionDescriptionKey(
  collectionId: MaybeRefOrGetter<number | null>
) {
  return [COLLECTIONS_QUERY_KEY, collectionId, VIEW];
}

export function useCollectionDescriptionQuery(
  collectionId: MaybeRefOrGetter<number | null>,
  options = {}
) {
  return useQuery({
    queryKey: collectionDescriptionKey(collectionId),
    enabled: () => !!toValue(collectionId),
    queryFn: async () => {
      const id = toValue(collectionId);
      return id ? fetchCollectionDescription(id) : null;
    },
    refetchOnWindowFocus: false,
    ...options,
  });
}
