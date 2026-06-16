import { useMutation, useQueryClient } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { originalStorageStatusQuery } from "./originalStorageStatusQuery";

// queue glacier download
export function useRestoreOriginalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileObjectId: string) =>
      fetchers.restoreOriginalFile(fileObjectId),
    onSuccess: (_data, fileObjectId) => {
      queryClient.setQueryData(
        originalStorageStatusQuery(fileObjectId).queryKey,
        { status: "restoring" }
      );
    },
  });
}
