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
export const groupKeys = {
  all: ["groups"] as const,
  list: () => ["groups", "list"] as const,
  item: (groupId: number) => ["groups", "item", groupId] as const,
  entries: (groupId: number) =>
    [...groupKeys.item(groupId), "entries"] as const,
  members: (groupId: number) =>
    [...groupKeys.item(groupId), "members"] as const,
  types: () => ["groupTypes"] as const,
};

// Queries are queryOptions factories so the key and fetcher stay welded
// together for every caller (useQuery, prefetchQuery, setQueryData).

export function groupsQuery() {
  return queryOptions({
    queryKey: groupKeys.list(),
    queryFn: fetchers.fetchGroups,
  });
}

// Pass `enabled` so a group's members load only when its row is expanded.
export function groupMembersQuery(
  groupId: MaybeRefOrGetter<number>,
  options?: { enabled?: MaybeRefOrGetter<boolean> }
) {
  return queryOptions({
    queryKey: computed(() => groupKeys.members(toValue(groupId))),
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
    queryKey: computed(() => groupKeys.entries(toValue(groupId))),
    queryFn: () => fetchers.fetchGroupEntries(toValue(groupId)),
    enabled: computed(() => toValue(options?.enabled) ?? true),
  });
}

export function groupTypesQuery() {
  return queryOptions({
    queryKey: groupKeys.types(),
    queryFn: fetchers.fetchGroupTypes,
    // Types never change over a page's life, so fetch once and reuse.
    staleTime: Infinity,
  });
}

function useErrorToast(title: string): (error: Error) => void {
  const toastStore = useToastStore();
  return (error) =>
    toastStore.addToast({
      title,
      message: error.message ?? "Something went wrong. Unknown error.",
      variant: "error",
      duration: Infinity,
    });
}

export function useCreateGroupMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: fetchers.createGroup,
    onSuccess: (group) =>
      toastStore.addToast({
        message: `Group "${group.label}" created.`,
        variant: "success",
      }),
    onError: useErrorToast("Could not create group"),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: groupKeys.list() }),
  });
}

export function useUpdateGroupMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: (vars: { id: number; payload: UpdateGroupPayload }) =>
      fetchers.updateGroup(vars.id, vars.payload),
    onSuccess: (group) =>
      toastStore.addToast({
        message: `Group "${group.label}" updated.`,
        variant: "success",
      }),
    onError: useErrorToast("Could not update group"),
    // The list shows label and type, so it goes stale along with the item.
    onSettled: (_group, _error, vars) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: groupKeys.item(vars.id) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.list() }),
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
      queryClient.removeQueries({ queryKey: groupKeys.item(id) });
      return queryClient.invalidateQueries({ queryKey: groupKeys.list() });
    },
  });
}

// The member's display name rides along so the in-flight row can show it.
// The fetcher only reads the id fields.
export type AddGroupMemberVars = AddGroupMemberInput & { name: string };

export function useAddGroupMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: AddGroupMemberVars) => fetchers.addGroupMember(vars),
    onError: useErrorToast("Could not add member"),
    onSettled: (_member, _error, vars) =>
      queryClient.invalidateQueries({
        queryKey: groupKeys.members(vars.groupId),
      }),
  });
}

export function useRemoveGroupMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { groupId: number; userId: number }) =>
      fetchers.removeGroupMember(vars.groupId, vars.userId),
    onError: useErrorToast("Could not remove member"),
    onSettled: (_data, _error, vars) =>
      queryClient.invalidateQueries({
        queryKey: groupKeys.members(vars.groupId),
      }),
  });
}

export function useAddGroupEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fetchers.addGroupEntry,
    onError: useErrorToast("Could not add value"),
    // The list shows entries_count, so it goes stale along with the entries.
    onSettled: (_entry, _error, vars) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: groupKeys.entries(vars.groupId),
        }),
        queryClient.invalidateQueries({ queryKey: groupKeys.list() }),
      ]),
  });
}
