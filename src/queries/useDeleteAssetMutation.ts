import { useMutation, useQueryClient } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { AssetSummary } from "@/types";
import { ASSETS_QUERY_KEY } from "./queryKeys";
import { DELETED_ASSETS_QUERY_KEY } from "./useDeletedUserAssets";

export function useDeleteAssetMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fetchers.deleteAsset,
    onMutate: async (assetId) => {
      await queryClient.cancelQueries({ queryKey: [ASSETS_QUERY_KEY] });
      const previous = queryClient.getQueryData<AssetSummary[]>([
        ASSETS_QUERY_KEY,
      ]);
      queryClient.setQueryData<AssetSummary[]>([ASSETS_QUERY_KEY], (old) =>
        old?.filter((a) => a.objectId !== assetId)
      );
      return { previous };
    },
    onError: (_err, _assetId, context) => {
      if (context?.previous) {
        queryClient.setQueryData([ASSETS_QUERY_KEY], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [ASSETS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [DELETED_ASSETS_QUERY_KEY] });
    },
  });
}
