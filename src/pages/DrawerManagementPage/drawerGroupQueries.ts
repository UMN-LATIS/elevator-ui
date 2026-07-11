import { queryOptions, useMutation, useQueryClient } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { useToastStore } from "@/stores/toastStore";
import { makeQueryKeysFor } from "@/helpers/makeQueryKeysFor";
import type { UpdateGroupPayload, PermissionsGroup } from "@/types";

// "drawerGroups", not "groups", which the instance page already uses
const drawerGroupKeys = makeQueryKeysFor("drawerGroups");

export const queryKeys = {
  drawerGroupsList: drawerGroupKeys.list,
  drawerGroupItem: drawerGroupKeys.item,
  drawerGroupTypes: () => ["drawerGroupTypes"] as const,
  manageableDrawers: () => ["manageableDrawers"] as const,
};

export function drawerGroupsQuery() {
  return queryOptions({
    queryKey: queryKeys.drawerGroupsList(),
    queryFn: fetchers.fetchDrawerGroups,
  });
}

export function drawerGroupTypesQuery() {
  return queryOptions({
    queryKey: queryKeys.drawerGroupTypes(),
    queryFn: fetchers.fetchDrawerGroupTypes,
    // Types never change over a page's life, so fetch once and reuse.
    staleTime: Infinity,
  });
}

export function manageableDrawersQuery() {
  return queryOptions({
    queryKey: queryKeys.manageableDrawers(),
    queryFn: fetchers.fetchManageableDrawers,
  });
}

export function useCreateDrawerGroupMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: fetchers.createDrawerGroup,
    onSuccess: (group) => toastStore.success(`Group "${group.label}" created.`),
    onError: (error) =>
      toastStore.error(error.message, { title: "Could not create group" }),
    // return the promise so isPending stays true while the refetch is
    // in flight
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.drawerGroupsList(),
      }),
  });
}

export function useUpdateDrawerGroupMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: (vars: { id: number; payload: UpdateGroupPayload }) =>
      fetchers.updateDrawerGroup(vars.id, vars.payload),
    onSuccess: (group) => toastStore.success(`Group "${group.label}" updated.`),
    onError: (error) =>
      toastStore.error(error.message, { title: "Could not update group" }),
    // The list shows label and type, so it goes stale along with the item.
    onSettled: (_group, _error, vars) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.drawerGroupItem(vars.id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.drawerGroupsList(),
        }),
      ]),
  });
}

// Toasts for delete live at the call site, next to the confirm dialog.
export function useDeleteDrawerGroupMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: PermissionsGroup["id"]) => fetchers.deleteDrawerGroup(id),
    // The group no longer exists, so drop its item subtree instead of
    // invalidating it (a refetch would 404).
    onSettled: (_data, _error, id) => {
      queryClient.removeQueries({
        queryKey: queryKeys.drawerGroupItem(id),
      });
      return queryClient.invalidateQueries({
        queryKey: queryKeys.drawerGroupsList(),
      });
    },
  });
}
