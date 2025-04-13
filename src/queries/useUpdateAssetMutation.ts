import { useMutation, useQueryClient } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { ASSETS_QUERY_KEY, COLLECTIONS_QUERY_KEY } from "./queryKeys";

export function useUpdateAssetMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fetchers.updateAsset,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [ASSETS_QUERY_KEY],
      });
      queryClient.invalidateQueries({
        queryKey: [COLLECTIONS_QUERY_KEY],
      });
      queryClient.invalidateQueries({
        queryKey: [ASSETS_QUERY_KEY, variables.objectId],
      });
    },
  });
}
