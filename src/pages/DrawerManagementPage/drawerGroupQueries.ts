import { queryOptions, useMutation, useQueryClient } from "@tanstack/vue-query";
import type { QueryClient } from "@tanstack/vue-query";
import { computed, toValue, type MaybeRefOrGetter } from "vue";
import * as fetchers from "@/api/fetchers";
import type { AddGroupMemberInput } from "@/api/fetchers";
import { makeQueryKeysFor } from "@/helpers/makeQueryKeysFor";
import { drawerGrantQueryKeys } from "./drawerGrantQueries";

// "drawerGroups", not "groups", which the instance page already uses
const drawerGroupKeys = makeQueryKeysFor("drawerGroups");

export const queryKeys = {
  drawerGroupsList: drawerGroupKeys.list,
  drawerGroupItem: drawerGroupKeys.item,
  drawerGroupMembers: (groupId: number) =>
    [...drawerGroupKeys.item(groupId), "members"] as const,
  drawerGroupEntries: (groupId: number) =>
    [...drawerGroupKeys.item(groupId), "entries"] as const,
  drawerGroupTypes: () => ["drawerGroupTypes"] as const,
  manageableDrawers: () => ["manageableDrawers"] as const,
};

export function drawerGroupsQuery() {
  return queryOptions({
    queryKey: queryKeys.drawerGroupsList(),
    queryFn: fetchers.fetchDrawerGroups,
  });
}

// Pass `enabled` so a group's members load only when its row is expanded.
export function drawerGroupMembersQuery(
  groupId: MaybeRefOrGetter<number>,
  options?: { enabled?: MaybeRefOrGetter<boolean> }
) {
  return queryOptions({
    queryKey: computed(() => queryKeys.drawerGroupMembers(toValue(groupId))),
    queryFn: () => fetchers.fetchDrawerGroupMembers(toValue(groupId)),
    enabled: computed(() => toValue(options?.enabled) ?? true),
  });
}

// Same lazy-on-expand shape as members.
export function drawerGroupEntriesQuery(
  groupId: MaybeRefOrGetter<number>,
  options?: { enabled?: MaybeRefOrGetter<boolean> }
) {
  return queryOptions({
    queryKey: computed(() => queryKeys.drawerGroupEntries(toValue(groupId))),
    queryFn: () => fetchers.fetchDrawerGroupEntries(toValue(groupId)),
    enabled: computed(() => toValue(options?.enabled) ?? true),
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

// Mutations reconcile by invalidating rather than patching the cache
// optimistically.
export function useCreateDrawerGroupMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fetchers.createDrawerGroup,
    // return the promise so isPending stays true while the refetch is
    // in flight
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.drawerGroupsList(),
      }),
  });
}

export function useRenameDrawerGroupMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { id: number; label: string }) =>
      fetchers.renameDrawerGroup(vars.id, vars.label),
    onSettled: (_group, _error, vars) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.drawerGroupItem(vars.id),
        }),
        ...invalidateGroupLists(queryClient),
      ]),
  });
}

export function useDeleteDrawerGroupMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId: number) => fetchers.deleteDrawerGroup(groupId),
    // The group no longer exists, so drop its item subtree instead of
    // invalidating it (a refetch would 404).
    onSettled: (_data, _error, groupId) => {
      queryClient.removeQueries({
        queryKey: queryKeys.drawerGroupItem(groupId),
      });
      return Promise.all(invalidateGroupLists(queryClient));
    },
  });
}

/**
 * Mark both lists that describe a group stale.
 *
 * A group reaches the sharing table by two routes: a shared group's row
 * reads the name, type, and entry count copied onto its grant, and a
 * group with no rule reads the groups list. Anything that changes a
 * group, or removes it, changes what both of them say.
 */
function invalidateGroupLists(queryClient: QueryClient): Promise<void>[] {
  return [
    queryClient.invalidateQueries({
      queryKey: queryKeys.drawerGroupsList(),
    }),
    queryClient.invalidateQueries({
      queryKey: drawerGrantQueryKeys.drawerGrantsList(),
    }),
  ];
}

// The member's display name rides along so the in-flight row can show it.
// The fetcher only reads the id fields.
export type AddDrawerGroupMemberVars = AddGroupMemberInput & { name: string };

export function useAddDrawerGroupMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: AddDrawerGroupMemberVars) =>
      fetchers.addDrawerGroupMember(vars),
    onSettled: (_member, _error, vars) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.drawerGroupMembers(vars.groupId),
        }),
        ...invalidateGroupLists(queryClient),
      ]),
  });
}

export function useRemoveDrawerGroupMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { groupId: number; userId: number }) =>
      fetchers.removeDrawerGroupMember(vars.groupId, vars.userId),
    onSettled: (_data, _error, vars) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.drawerGroupMembers(vars.groupId),
        }),
        ...invalidateGroupLists(queryClient),
      ]),
  });
}

export function useAddDrawerGroupEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fetchers.addDrawerGroupEntry,
    onSettled: (_entry, _error, vars) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.drawerGroupEntries(vars.groupId),
        }),
        ...invalidateGroupLists(queryClient),
      ]),
  });
}

export function useUpdateDrawerGroupEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fetchers.updateDrawerGroupEntry,
    onSettled: (_entry, _error, vars) =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.drawerGroupEntries(vars.groupId),
      }),
  });
}

export function useRemoveDrawerGroupEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { groupId: number; entryId: number }) =>
      fetchers.removeDrawerGroupEntry(vars.groupId, vars.entryId),
    onSettled: (_data, _error, vars) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.drawerGroupEntries(vars.groupId),
        }),
        ...invalidateGroupLists(queryClient),
      ]),
  });
}
