import { queryOptions, useMutation, useQueryClient } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { useToastStore } from "@/stores/toastStore";
import { makeQueryKeysFor } from "@/helpers/makeQueryKeysFor";
import type { UpdateDrawerGrantPayload } from "@/types";

// A grant is one group's permission level on one drawer, which the
// sharing table shows as that group's row rather than as a thing of its
// own.
const drawerGrantKeys = makeQueryKeysFor("drawerGrants");

export const drawerGrantQueryKeys = {
  drawerGrantsList: drawerGrantKeys.list,
};

export function drawerGrantsQuery() {
  return queryOptions({
    queryKey: drawerGrantKeys.list(),
    queryFn: fetchers.fetchDrawerGrants,
  });
}

export type UpdateDrawerGrantVars = UpdateDrawerGrantPayload & {
  grantId: number;
};

// Mutations reconcile by invalidating rather than patching the cache
// optimistically. Call sites render in-flight feedback from isPending.

export function useCreateDrawerGrantMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: fetchers.createDrawerGrant,
    onSuccess: () => toastStore.success("Rule created."),
    onError: (error) =>
      toastStore.error(error.message, { title: "Could not save rule" }),
    // return the promise so isPending stays true while the refetch is
    // in flight
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: drawerGrantKeys.list() }),
  });
}

export function useUpdateDrawerGrantMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: ({ grantId, ...payload }: UpdateDrawerGrantVars) =>
      fetchers.updateDrawerGrant(grantId, payload),
    onSuccess: () => toastStore.success("Rule updated."),
    onError: (error) =>
      toastStore.error(error.message, { title: "Could not save rule" }),
    // return the promise so isPending stays true while the refetch is
    // in flight
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: drawerGrantKeys.list() }),
  });
}

// Toasts for delete live at the call site, next to the confirm dialog.
export function useDeleteDrawerGrantMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (grantId: number) => fetchers.deleteDrawerGrant(grantId),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: drawerGrantKeys.list() }),
  });
}
