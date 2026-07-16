import { queryOptions, useMutation, useQueryClient } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { useToastStore } from "@/stores/toastStore";
import { makeQueryKeysFor } from "@/helpers/makeQueryKeysFor";
import type { CreateDrawerGrantPayload } from "@/types";

// A "rule" in the UI is a "grant" in the backend.
const drawerGrantKeys = makeQueryKeysFor("drawerGrants");

export function drawerGrantsQuery() {
  return queryOptions({
    queryKey: drawerGrantKeys.list(),
    queryFn: fetchers.fetchDrawerGrants,
  });
}

// A grant's drawer and group are fixed once created, so an update
// carries only the new level.
export type SaveDrawerGrantInput =
  | { kind: "create"; grant: CreateDrawerGrantPayload }
  | { kind: "update"; grantId: number; permissionLevelId: number };

// Mutations reconcile by invalidating in onSettled instead of patching the
// cache optimistically. Call sites render in-flight feedback from isPending,
// which stays true until the promise returned by onSettled (the reconciling
// refetch) resolves, so pending markers hold until fresh data lands.

export function useSaveDrawerGrantMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: (input: SaveDrawerGrantInput) =>
      input.kind === "create"
        ? fetchers.createDrawerGrant(input.grant)
        : fetchers.updateDrawerGrant(input.grantId, input.permissionLevelId),
    onSuccess: (_grant, input) =>
      toastStore.success(
        input.kind === "create" ? "Rule created." : "Rule updated."
      ),
    onError: (error) =>
      toastStore.error(error.message, { title: "Could not save rule" }),
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
