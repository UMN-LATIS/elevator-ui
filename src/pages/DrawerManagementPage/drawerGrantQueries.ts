import { queryOptions, useMutation, useQueryClient } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { makeQueryKeysFor } from "@/helpers/makeQueryKeysFor";
import type { UpdateDrawerGrantPayload } from "@/types";

// A grant is one group's permission level on one drawer, which the
// sharing table shows as that group's row rather than as a thing of its
// own.
export const drawerGrantKeys = makeQueryKeysFor("drawerGrants");

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
// optimistically.

export function useCreateDrawerGrantMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fetchers.createDrawerGrant,
    // return the promise so isPending stays true while the refetch is
    // in flight
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: drawerGrantKeys.list() }),
  });
}

export function useUpdateDrawerGrantMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ grantId, ...payload }: UpdateDrawerGrantVars) =>
      fetchers.updateDrawerGrant(grantId, payload),
    // return the promise so isPending stays true while the refetch is
    // in flight
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: drawerGrantKeys.list() }),
  });
}

export function useDeleteDrawerGrantMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (grantId: number) => fetchers.deleteDrawerGrant(grantId),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: drawerGrantKeys.list() }),
  });
}
