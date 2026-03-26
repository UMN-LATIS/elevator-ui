import { useMutation, useQueryClient } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { AssetSummary, DeletedAssetSummary } from "@/types";
import { ASSETS_QUERY_KEY } from "./queryKeys";
import { DELETED_ASSETS_QUERY_KEY } from "./useDeletedUserAssets";
import { useToastStore } from "@/stores/toastStore";

const DELETE_MUTATION_KEY = ["deleteAsset"] as const;

export function useDeleteAssetMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationKey: DELETE_MUTATION_KEY,
    mutationFn: fetchers.deleteAsset,
    onMutate: async (assetId) => {
      await queryClient.cancelQueries({ queryKey: [ASSETS_QUERY_KEY] });
      await queryClient.cancelQueries({
        queryKey: [DELETED_ASSETS_QUERY_KEY],
      });

      const activeAssets = queryClient.getQueryData<AssetSummary[]>([
        ASSETS_QUERY_KEY,
      ]);
      const deleted = activeAssets?.find((a) => a.objectId === assetId);

      // Remove from active assets
      queryClient.setQueryData<AssetSummary[]>([ASSETS_QUERY_KEY], (old) =>
        old?.filter((a) => a.objectId !== assetId)
      );

      // Add to deleted assets (marked pending until server confirms)
      if (deleted) {
        queryClient.setQueryData<DeletedAssetSummary[]>(
          [DELETED_ASSETS_QUERY_KEY],
          (old) => [
            {
              ...deleted,
              deletedAt: new Date().toISOString(),
              deletedBy: null,
              pending: true,
            } as DeletedAssetSummary & { pending: boolean },
            ...(old ?? []),
          ]
        );
      }

      return { deletedAsset: deleted };
    },
    onSuccess: (_data, _assetId, context) => {
      const label = context?.deletedAsset?.title || _assetId;
      toastStore.addToast({
        message: `"${label}" moved to trash.`,
        variant: "success",
      });
    },
    onError: (_err, assetId, context) => {
      toastStore.addToast({
        title: "Delete failed",
        message: _err.message ?? "Could not delete asset.",
        variant: "error",
        duration: Infinity,
      });
      // Re-add only the failed asset instead of restoring a stale snapshot
      if (context?.deletedAsset) {
        queryClient.setQueryData<AssetSummary[]>(
          [ASSETS_QUERY_KEY],
          (old) => [context.deletedAsset!, ...(old ?? [])]
        );
      }
      queryClient.setQueryData<DeletedAssetSummary[]>(
        [DELETED_ASSETS_QUERY_KEY],
        (old) => old?.filter((a) => a.objectId !== assetId)
      );
    },
    onSettled: () => {
      // isMutating() still counts the current mutation as pending inside
      // onSettled (state dispatches after callbacks), so === 1 means
      // "I am the last in-flight mutation."
      if (queryClient.isMutating({ mutationKey: DELETE_MUTATION_KEY }) === 1) {
        queryClient.invalidateQueries({ queryKey: [ASSETS_QUERY_KEY] });
        queryClient.invalidateQueries({
          queryKey: [DELETED_ASSETS_QUERY_KEY],
        });
      }
    },
  });
}
