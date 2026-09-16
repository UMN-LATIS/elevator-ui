import { queryOptions, useQuery } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { toValue, type MaybeRefOrGetter } from "vue";
import { ASSETS_QUERY_KEY } from "./queryKeys";

export function assetQuery(assetId: MaybeRefOrGetter<string | null>) {
  return queryOptions({
    queryKey: [ASSETS_QUERY_KEY, assetId],
    queryFn: async () => {
      const id = toValue(assetId);
      return id ? await fetchers.fetchAsset(id) : null;
    },
  });
}

export function useAssetQuery(
  assetId: MaybeRefOrGetter<string | null>,
  options = {}
) {
  return useQuery({
    ...assetQuery(assetId),
    enabled: () => !!toValue(assetId),
    placeholderData: () => null,
    refetchOnWindowFocus: false,
    ...options,
  });
}
