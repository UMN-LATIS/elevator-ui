import { useQuery } from "@tanstack/vue-query";
import { fetchAllUserAssets } from "@/api/fetchers";
import { AssetSummary } from "@/types";
import { ASSETS_QUERY_KEY } from "./queryKeys";

export function useAllUserAssets() {
  return useQuery({
    queryKey: [ASSETS_QUERY_KEY],
    queryFn: fetchAllUserAssets,
    initialData: () => [] as AssetSummary[],
  });
}
