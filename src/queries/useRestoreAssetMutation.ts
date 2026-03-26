import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { undeleteAsset } from "@/api/fetchers";
import { AssetSummary, DeletedAssetSummary } from "@/types";
import { ASSETS_QUERY_KEY } from "./queryKeys";
import { DELETED_ASSETS_QUERY_KEY } from "./useDeletedUserAssets";
import { useToastStore } from "@/stores/toastStore";

const RESTORE_MUTATION_KEY = ["restoreAsset"] as const;

export function useRestoreAssetMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationKey: RESTORE_MUTATION_KEY,
    mutationFn: undeleteAsset,
    onMutate: async (assetId) => {
      await queryClient.cancelQueries({ queryKey: [ASSETS_QUERY_KEY] });
      await queryClient.cancelQueries({
        queryKey: [DELETED_ASSETS_QUERY_KEY],
      });

      // Remove from deleted assets
      const deletedAssets = queryClient.getQueryData<DeletedAssetSummary[]>([
        DELETED_ASSETS_QUERY_KEY,
      ]);
      const restored = deletedAssets?.find((a) => a.objectId === assetId);
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

      return { restoredAsset: restored };
    },
    onSuccess: (_data, _assetId, context) => {
      const label = context?.restoredAsset?.title || _assetId;
      toastStore.addToast({
        message: `"${label}" restored.`,
        variant: "success",
      });
    },
    onError: (_err, assetId, context) => {
      toastStore.addToast({
        title: "Restore failed",
        message: _err.message ?? "Could not restore asset.",
        variant: "error",
        duration: Infinity,
      });
      // Re-add only the failed asset instead of restoring a stale snapshot
      if (context?.restoredAsset) {
        queryClient.setQueryData<DeletedAssetSummary[]>(
          [DELETED_ASSETS_QUERY_KEY],
          (old) => [context.restoredAsset!, ...(old ?? [])]
        );
      }
      queryClient.setQueryData<AssetSummary[]>(
        [ASSETS_QUERY_KEY],
        (old) => old?.filter((a) => a.objectId !== assetId)
      );
    },
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: RESTORE_MUTATION_KEY }) === 1) {
        queryClient.invalidateQueries({ queryKey: [ASSETS_QUERY_KEY] });
        queryClient.invalidateQueries({
          queryKey: [DELETED_ASSETS_QUERY_KEY],
        });
      }
    },
  });
}
