import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { undeleteAsset } from "@/api/fetchers";
import { DeletedAssetSummary } from "@/types";
import { ASSETS_QUERY_KEY } from "./queryKeys";
import { DELETED_ASSETS_QUERY_KEY } from "./useDeletedUserAssets";

export function useRestoreAssetMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: undeleteAsset,
    onMutate: async (assetId) => {
      await queryClient.cancelQueries({
        queryKey: [DELETED_ASSETS_QUERY_KEY],
      });
      const previous = queryClient.getQueryData<DeletedAssetSummary[]>([
        DELETED_ASSETS_QUERY_KEY,
      ]);
      queryClient.setQueryData<DeletedAssetSummary[]>(
        [DELETED_ASSETS_QUERY_KEY],
        (old) => old?.filter((a) => a.objectId !== assetId)
      );
      return { previous };
    },
    onError: (_err, _assetId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          [DELETED_ASSETS_QUERY_KEY],
          context.previous
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [ASSETS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [DELETED_ASSETS_QUERY_KEY] });
    },
  });
}
