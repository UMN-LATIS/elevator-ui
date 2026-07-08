import { queryOptions, useMutation, useQueryClient } from "@tanstack/vue-query";
import { computed, toValue, type MaybeRefOrGetter } from "vue";
import * as fetchers from "@/api/fetchers";
import type { AddGroupMemberInput } from "@/api/fetchers";
import { useToastStore } from "@/stores/toastStore";
import type { PermissionsGroup, UpdateGroupPayload } from "@/types";

// Invalidation matches keys by prefix. The kind ("list" or "item")
// comes right after the resource so list data and item data are
// separate branches: the list can be refreshed without refetching
// every group, and ["groups", "item"] targets all items but not the
// list. See https://tkdodo.eu/blog/effective-react-query-keys
export const makeQueryKeyFor = {
  groupsList: () => ["groups", "list"] as const,
  groupDetails: (groupId: number) => ["groups", "item", groupId] as const,
  groupEntries: (groupId: number) =>
    [...makeQueryKeyFor.groupDetails(groupId), "entries"] as const,
  groupMembers: (groupId: number) =>
    [...makeQueryKeyFor.groupDetails(groupId), "members"] as const,
  groupTypes: () => ["groupTypes"] as const,
};

// Queries are queryOptions factories so the key and fetcher stay welded
// together for every caller (useQuery, prefetchQuery, setQueryData).

export function groupsQuery() {
  return queryOptions({
    queryKey: makeQueryKeyFor.groupsList(),
    queryFn: fetchers.fetchGroups,
  });
}

// Pass `enabled` so a group's members load only when its row is expanded.
export function groupMembersQuery(
  groupId: MaybeRefOrGetter<number>,
  options?: { enabled?: MaybeRefOrGetter<boolean> }
) {
  return queryOptions({
    queryKey: computed(() => makeQueryKeyFor.groupMembers(toValue(groupId))),
    queryFn: () => fetchers.fetchGroupMembers(toValue(groupId)),
    enabled: computed(() => toValue(options?.enabled) ?? true),
  });
}

// Same lazy-on-expand shape as members.
export function groupEntriesQuery(
  groupId: MaybeRefOrGetter<number>,
  options?: { enabled?: MaybeRefOrGetter<boolean> }
) {
  return queryOptions({
    queryKey: computed(() => makeQueryKeyFor.groupEntries(toValue(groupId))),
    queryFn: () => fetchers.fetchGroupEntries(toValue(groupId)),
    enabled: computed(() => toValue(options?.enabled) ?? true),
  });
}

export function groupTypesQuery() {
  return queryOptions({
    queryKey: makeQueryKeyFor.groupTypes(),
    queryFn: fetchers.fetchGroupTypes,
    // Types never change over a page's life, so fetch once and reuse.
    staleTime: Infinity,
  });
}

// Mutations reconcile by invalidating in onSettled instead of patching the
// cache optimistically. Call sites render in-flight feedback from isPending,
// which stays true until the promise returned by onSettled (the reconciling
// refetch) resolves, so pending markers hold until fresh data lands.

export function useCreateGroupMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: fetchers.createGroup,
    onSuccess: (group) => toastStore.success(`Group "${group.label}" created.`),
    onError: (error) =>
      toastStore.error(error.message, { title: "Could not create group" }),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: makeQueryKeyFor.groupsList() }),
  });
}

export function useUpdateGroupMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: (vars: { id: number; payload: UpdateGroupPayload }) =>
      fetchers.updateGroup(vars.id, vars.payload),
    onSuccess: (group) => toastStore.success(`Group "${group.label}" updated.`),
    onError: (error) =>
      toastStore.error(error.message, { title: "Could not update group" }),
    // The list shows label and type, so it goes stale along with the item.
    onSettled: (_group, _error, vars) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: makeQueryKeyFor.groupDetails(vars.id),
        }),
        queryClient.invalidateQueries({
          queryKey: makeQueryKeyFor.groupsList(),
        }),
      ]),
  });
}

// Toasts for delete live at the call site, next to the confirm dialog.
export function useDeleteGroupMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: PermissionsGroup["id"]) => fetchers.deleteGroup(id),
    // The group no longer exists, so drop its item subtree instead of
    // invalidating it (a refetch would 404).
    onSettled: (_data, _error, id) => {
      queryClient.removeQueries({ queryKey: makeQueryKeyFor.groupDetails(id) });
      return queryClient.invalidateQueries({
        queryKey: makeQueryKeyFor.groupsList(),
      });
    },
  });
}

// The member's display name rides along so the in-flight row can show it.
// The fetcher only reads the id fields.
export type AddGroupMemberVars = AddGroupMemberInput & { name: string };

export function useAddGroupMemberMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: (vars: AddGroupMemberVars) => fetchers.addGroupMember(vars),
    onError: (error) =>
      toastStore.error(error.message, { title: "Could not add member" }),
    onSettled: (_member, _error, vars) =>
      queryClient.invalidateQueries({
        queryKey: makeQueryKeyFor.groupMembers(vars.groupId),
      }),
  });
}

export function useRemoveGroupMemberMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: (vars: { groupId: number; userId: number }) =>
      fetchers.removeGroupMember(vars.groupId, vars.userId),
    onError: (error) =>
      toastStore.error(error.message, { title: "Could not remove member" }),
    onSettled: (_data, _error, vars) =>
      queryClient.invalidateQueries({
        queryKey: makeQueryKeyFor.groupMembers(vars.groupId),
      }),
  });
}

export function useAddGroupEntryMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: fetchers.addGroupEntry,
    onError: (error) =>
      toastStore.error(error.message, { title: "Could not add value" }),
    // The list shows entries_count, so it goes stale along with the entries.
    onSettled: (_entry, _error, vars) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: makeQueryKeyFor.groupEntries(vars.groupId),
        }),
        queryClient.invalidateQueries({
          queryKey: makeQueryKeyFor.groupsList(),
        }),
      ]),
  });
}

// Editing a value in place leaves entries_count alone, so the list stays fresh.
export function useUpdateGroupEntryMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: fetchers.updateGroupEntry,
    onError: (error) =>
      toastStore.error(error.message, { title: "Could not update value" }),
    onSettled: (_entry, _error, vars) =>
      queryClient.invalidateQueries({
        queryKey: makeQueryKeyFor.groupEntries(vars.groupId),
      }),
  });
}

export function useRemoveGroupEntryMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: (vars: { groupId: number; entryId: number }) =>
      fetchers.removeGroupEntry(vars.groupId, vars.entryId),
    onError: (error) =>
      toastStore.error(error.message, { title: "Could not remove value" }),
    // The list shows entries_count, so it goes stale along with the entries.
    onSettled: (_data, _error, vars) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: makeQueryKeyFor.groupEntries(vars.groupId),
        }),
        queryClient.invalidateQueries({
          queryKey: makeQueryKeyFor.groupsList(),
        }),
      ]),
  });
}
