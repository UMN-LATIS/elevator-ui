import { useQuery } from "@tanstack/vue-query";
import { fetchDeletedUserAssets } from "@/api/fetchers";
import { DeletedAssetSummary } from "@/types";

export const DELETED_ASSETS_QUERY_KEY = "deletedAssets";

export function useDeletedUserAssets() {
  return useQuery({
    queryKey: [DELETED_ASSETS_QUERY_KEY],
    queryFn: fetchDeletedUserAssets,
    initialData: () => [] as DeletedAssetSummary[],
  });
}
