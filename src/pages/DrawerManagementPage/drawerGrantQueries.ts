import { queryOptions, useMutation, useQueryClient } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { useToastStore } from "@/stores/toastStore";
import { makeQueryKeysFor } from "@/helpers/makeQueryKeysFor";

// A "rule" in the UI is a "grant" in the backend.
const drawerGrantKeys = makeQueryKeysFor("drawerGrants");

export function drawerGrantsQuery() {
  return queryOptions({
    queryKey: drawerGrantKeys.list(),
    queryFn: fetchers.fetchDrawerGrants,
  });
}

export type UpdateDrawerGrantVars = {
  grantId: number;
  permissionLevelId: number;
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
    mutationFn: (vars: UpdateDrawerGrantVars) =>
      fetchers.updateDrawerGrant(vars.grantId, vars.permissionLevelId),
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
