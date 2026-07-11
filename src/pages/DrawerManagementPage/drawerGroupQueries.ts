import { queryOptions, useMutation, useQueryClient } from "@tanstack/vue-query";
import { computed, toValue, type MaybeRefOrGetter } from "vue";
import * as fetchers from "@/api/fetchers";
import type { AddGroupMemberInput } from "@/api/fetchers";
import { useToastStore } from "@/stores/toastStore";
import { makeQueryKeysFor } from "@/helpers/makeQueryKeysFor";
import type { UpdateGroupPayload, PermissionsGroup } from "@/types";

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

// The member's display name rides along so the in-flight row can show it.
// The fetcher only reads the id fields.
export type AddDrawerGroupMemberVars = AddGroupMemberInput & { name: string };

export function useAddDrawerGroupMemberMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: (vars: AddDrawerGroupMemberVars) =>
      fetchers.addDrawerGroupMember(vars),
    onError: (error) =>
      toastStore.error(error.message, { title: "Could not add member" }),
    // The list's count chip tallies members, so it goes stale along with
    // the member list.
    onSettled: (_member, _error, vars) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.drawerGroupMembers(vars.groupId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.drawerGroupsList(),
        }),
      ]),
  });
}

export function useRemoveDrawerGroupMemberMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: (vars: { groupId: number; userId: number }) =>
      fetchers.removeDrawerGroupMember(vars.groupId, vars.userId),
    onError: (error) =>
      toastStore.error(error.message, { title: "Could not remove member" }),
    onSettled: (_data, _error, vars) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.drawerGroupMembers(vars.groupId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.drawerGroupsList(),
        }),
      ]),
  });
}

export function useAddDrawerGroupEntryMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: fetchers.addDrawerGroupEntry,
    onError: (error) =>
      toastStore.error(error.message, { title: "Could not add value" }),
    // The list shows entries_count, so it goes stale along with the entries.
    onSettled: (_entry, _error, vars) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.drawerGroupEntries(vars.groupId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.drawerGroupsList(),
        }),
      ]),
  });
}

// Editing a value in place leaves entries_count alone, so the list stays fresh.
export function useUpdateDrawerGroupEntryMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: fetchers.updateDrawerGroupEntry,
    onError: (error) =>
      toastStore.error(error.message, { title: "Could not update value" }),
    onSettled: (_entry, _error, vars) =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.drawerGroupEntries(vars.groupId),
      }),
  });
}

export function useRemoveDrawerGroupEntryMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: (vars: { groupId: number; entryId: number }) =>
      fetchers.removeDrawerGroupEntry(vars.groupId, vars.entryId),
    onError: (error) =>
      toastStore.error(error.message, { title: "Could not remove value" }),
    // The list shows entries_count, so it goes stale along with the entries.
    onSettled: (_data, _error, vars) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.drawerGroupEntries(vars.groupId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.drawerGroupsList(),
        }),
      ]),
  });
}
