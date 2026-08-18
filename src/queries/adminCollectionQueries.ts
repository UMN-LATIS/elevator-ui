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

export function useCreateCollectionMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: (collection: SaveCollectionPayload) =>
      fetchers.createCollection(collection),
    onSuccess: () => toastStore.success("Collection created."),
    onError: (error) =>
      toastStore.error(error.message, { title: "Could not create collection" }),
    // return the promise so isPending stays true while the refetch is
    // in flight
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: adminCollectionKeys.list() }),
  });
}

export function useUpdateCollectionMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: (input: {
      collectionId: number;
      collection: SaveCollectionPayload;
    }) => fetchers.updateCollection(input.collectionId, input.collection),
    onSuccess: () => toastStore.success("Collection updated."),
    onError: (error) =>
      toastStore.error(error.message, { title: "Could not update collection" }),
    // return the promise so isPending stays true while the refetches
    // are in flight
    onSettled: (_collection, _error, input) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: adminCollectionKeys.list() }),
        queryClient.invalidateQueries({
          queryKey: adminCollectionKeys.item(input.collectionId),
        }),
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
