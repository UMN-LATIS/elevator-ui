import { useQuery } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { toValue, type MaybeRefOrGetter } from "vue";
import { ASSETS_QUERY_KEY } from "./queryKeys";

export function useAssetQuery(
  assetId: MaybeRefOrGetter<string | null>,
  options = {}
) {
  return useQuery({
    queryKey: [ASSETS_QUERY_KEY, assetId],
    enabled: !!toValue(assetId),
    initialData: () => null,
    queryFn: async () => {
      const id = toValue(assetId);
      return id ? await fetchers.fetchAsset(id) : null;
    },
    refetchOnWindowFocus: false,
    ...options,
  });
}
