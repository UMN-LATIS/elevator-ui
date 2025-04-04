import { useQuery } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { toValue, type MaybeRefOrGetter } from "vue";
import { ASSETS_QUERY_KEY } from "./queryKeys";

export function useAssetByIdQuery(assetId: MaybeRefOrGetter<string | null>) {
  return useQuery({
    queryKey: [ASSETS_QUERY_KEY, assetId],
    queryFn: () => {
      const id = toValue(assetId);
      if (!id) {
        return Promise.resolve(null);
      }
      return fetchers.fetchAsset(id);
    },
    refetchOnWindowFocus: false,
  });
}
