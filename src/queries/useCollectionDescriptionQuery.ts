import { useQuery } from "@tanstack/vue-query";
import { fetchCollectionDescription } from "@/api/fetchers";
import { toValue, type MaybeRefOrGetter } from "vue";
import { COLLECTIONS_QUERY_KEY, VIEW } from "./queryKeys";

export function useCollectionDescriptionQuery(
  collectionId: MaybeRefOrGetter<number | null>,
  options = {}
) {
  return useQuery({
    queryKey: [COLLECTIONS_QUERY_KEY, collectionId, VIEW],
    enabled: () => !!toValue(collectionId),
    queryFn: async () => {
      const id = toValue(collectionId);
      return id ? fetchCollectionDescription(id) : null;
    },
    refetchOnWindowFocus: false,
    ...options,
  });
}
