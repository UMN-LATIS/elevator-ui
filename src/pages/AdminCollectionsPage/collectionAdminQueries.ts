import { queryOptions, useMutation, useQueryClient } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import type { SaveCollectionPayload } from "@/api/fetchers";
import { makeQueryKeysFor } from "@/helpers/makeQueryKeysFor";
import { useToastStore } from "@/stores/toastStore";

export const adminCollectionKeys = makeQueryKeysFor("adminCollections");

export function adminCollectionsQuery() {
  return queryOptions({
    queryKey: adminCollectionKeys.list(),
    queryFn: fetchers.fetchAdminCollections,
  });
}

export function adminCollectionQuery(collectionId: number) {
  return queryOptions({
    queryKey: adminCollectionKeys.item(collectionId),
    queryFn: () => fetchers.fetchAdminCollection(collectionId),
  });
}

export type SaveCollectionMutationInput =
  | { kind: "create"; collection: SaveCollectionPayload }
  | {
      kind: "update";
      collectionId: number;
      collection: SaveCollectionPayload;
    };

export function useSaveCollectionMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: (input: SaveCollectionMutationInput) =>
      input.kind === "create"
        ? fetchers.createCollection(input.collection)
        : fetchers.updateCollection(input.collectionId, input.collection),
    onSuccess: (_collection, input) =>
      toastStore.success(
        input.kind === "create" ? "Collection created." : "Collection updated."
      ),
    onError: (error) =>
      toastStore.error(error.message, { title: "Could not save collection" }),
    // return the promise so isPending stays true while the refetches
    // are in flight
    onSettled: (_collection, _error, input) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminCollectionKeys.list(),
        }),
        input.kind === "update"
          ? queryClient.invalidateQueries({
              queryKey: adminCollectionKeys.item(input.collectionId),
            })
          : Promise.resolve(),
      ]),
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
