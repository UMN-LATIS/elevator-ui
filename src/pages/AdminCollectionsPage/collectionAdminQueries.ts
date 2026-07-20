import { queryOptions, useMutation, useQueryClient } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { makeQueryKeysFor } from "@/helpers/makeQueryKeysFor";

export const adminCollectionKeys = makeQueryKeysFor("adminCollections");

export function adminCollectionsQuery() {
  return queryOptions({
    queryKey: adminCollectionKeys.list(),
    queryFn: fetchers.fetchAdminCollections,
  });
}

// Toasts for delete live at the call site, next to the confirm dialog.
export function useDeleteCollectionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (collectionId: number) =>
      fetchers.deleteCollection(collectionId),
    // return the promise so isPending stays true while the refetch is
    // in flight
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: adminCollectionKeys.list() }),
  });
}
