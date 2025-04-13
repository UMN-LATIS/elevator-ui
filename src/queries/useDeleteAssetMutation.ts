import { useMutation, useQueryClient } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { ASSETS_QUERY_KEY } from "./queryKeys";

export function useDeleteAssetMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fetchers.deleteAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [ASSETS_QUERY_KEY],
      });
    },
  });
}
