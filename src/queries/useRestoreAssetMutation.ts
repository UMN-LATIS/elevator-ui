import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { undeleteAsset } from "@/api/fetchers";
import { ASSETS_QUERY_KEY } from "./queryKeys";
import { DELETED_ASSETS_QUERY_KEY } from "./useDeletedUserAssets";

export function useRestoreAssetMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: undeleteAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ASSETS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [DELETED_ASSETS_QUERY_KEY] });
    },
  });
}
