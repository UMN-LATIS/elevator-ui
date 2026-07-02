import { queryOptions, useMutation, useQueryClient } from "@tanstack/vue-query";
import { computed, toValue, type MaybeRefOrGetter } from "vue";
import * as fetchers from "@/api/fetchers";
import type { AddGroupMemberInput } from "@/api/fetchers";
import { useToastStore } from "@/stores/toastStore";
import type { PermissionsGroup, UpdateGroupPayload } from "@/types";

// Keys mirror the REST paths and compose by prefix: item(id) is a prefix of
// members(id) and entries(id), so invalidating `all` or one group's item key
// refreshes every query beneath it.
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

// Mutations never write to the cache, so it only ever holds server
// responses. Each one invalidates the groups subtree in onSettled and
// returns the promise, which keeps isPending true until the refetched lists
// land. Components derive in-flight rows from isPending + variables.

function useInvalidateGroups(): () => Promise<void> {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: groupKeys.all });
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
  const invalidateGroups = useInvalidateGroups();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: fetchers.createGroup,
    onSuccess: (group) =>
      toastStore.addToast({
        message: `Group "${group.label}" created.`,
        variant: "success",
      }),
    onError: useErrorToast("Could not create group"),
    onSettled: invalidateGroups,
  });
}

export function useUpdateGroupMutation() {
  const invalidateGroups = useInvalidateGroups();
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
    onSettled: invalidateGroups,
  });
}

// Toasts for delete live at the call site, next to the confirm dialog.
export function useDeleteGroupMutation() {
  const invalidateGroups = useInvalidateGroups();

  return useMutation({
    mutationFn: (id: PermissionsGroup["id"]) => fetchers.deleteGroup(id),
    onSettled: invalidateGroups,
  });
}

// The member's display name rides along so the in-flight row can show it.
// The fetcher only reads the id fields.
export type AddGroupMemberVars = AddGroupMemberInput & { name: string };

export function useAddGroupMemberMutation() {
  const invalidateGroups = useInvalidateGroups();

  return useMutation({
    mutationFn: (vars: AddGroupMemberVars) => fetchers.addGroupMember(vars),
    onError: useErrorToast("Could not add member"),
    onSettled: invalidateGroups,
  });
}

export function useRemoveGroupMemberMutation() {
  const invalidateGroups = useInvalidateGroups();

  return useMutation({
    mutationFn: (vars: { groupId: number; userId: number }) =>
      fetchers.removeGroupMember(vars.groupId, vars.userId),
    onError: useErrorToast("Could not remove member"),
    onSettled: invalidateGroups,
  });
}

export function useAddGroupEntryMutation() {
  const invalidateGroups = useInvalidateGroups();

  return useMutation({
    mutationFn: fetchers.addGroupEntry,
    onError: useErrorToast("Could not add value"),
    onSettled: invalidateGroups,
  });
}
