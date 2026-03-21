import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { undeleteAsset } from "@/api/fetchers";
import { AssetSummary, DeletedAssetSummary } from "@/types";
import { ASSETS_QUERY_KEY } from "./queryKeys";
import { DELETED_ASSETS_QUERY_KEY } from "./useDeletedUserAssets";

export function useRestoreAssetMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: undeleteAsset,
    onMutate: async (assetId) => {
      await queryClient.cancelQueries({ queryKey: [ASSETS_QUERY_KEY] });
      await queryClient.cancelQueries({
        queryKey: [DELETED_ASSETS_QUERY_KEY],
      });

      const previousAssets = queryClient.getQueryData<AssetSummary[]>([
        ASSETS_QUERY_KEY,
      ]);
      const previousDeleted = queryClient.getQueryData<DeletedAssetSummary[]>([
        DELETED_ASSETS_QUERY_KEY,
      ]);

      // Remove from deleted assets
      const restored = previousDeleted?.find((a) => a.objectId === assetId);
      queryClient.setQueryData<DeletedAssetSummary[]>(
        [DELETED_ASSETS_QUERY_KEY],
        (old) => old?.filter((a) => a.objectId !== assetId)
      );

      // Add to active assets
      if (restored) {
        const { deletedAt: _, deletedBy: __, ...assetSummary } = restored;
        queryClient.setQueryData<AssetSummary[]>(
          [ASSETS_QUERY_KEY],
          (old) => [assetSummary, ...(old ?? [])]
        );
      }

      return { previousAssets, previousDeleted };
    },
    onError: (_err, _assetId, context) => {
      if (context?.previousAssets) {
        queryClient.setQueryData([ASSETS_QUERY_KEY], context.previousAssets);
      }
      if (context?.previousDeleted) {
        queryClient.setQueryData(
          [DELETED_ASSETS_QUERY_KEY],
          context.previousDeleted
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [ASSETS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [DELETED_ASSETS_QUERY_KEY] });
    },
  });
}
