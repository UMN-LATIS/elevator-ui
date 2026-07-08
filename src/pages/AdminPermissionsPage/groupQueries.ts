import {
  queryOptions,
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/vue-query";
import { computed, toValue, type MaybeRefOrGetter } from "vue";
import * as fetchers from "@/api/fetchers";
import type { AddGroupMemberInput } from "@/api/fetchers";
import { useToastStore } from "@/stores/toastStore";
import type {
  GroupMember,
  PermissionsGroup,
  PermissionsGroupEntry,
  UpdateGroupPayload,
} from "@/types";

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

// Optimistic-update plumbing. onMutate snapshots the caches it is about to
// touch, after cancelling in-flight refetches that could otherwise land on
// top of the patch, and onError restores the snapshot when the server
// rejects the change. onSettled still invalidates to reconcile with the
// server, but that refetch runs in the background so the user never waits.
type CacheSnapshot = { queryKey: readonly unknown[]; data: unknown }[];

async function snapshotAndCancel(
  queryClient: QueryClient,
  keys: readonly (readonly unknown[])[]
): Promise<CacheSnapshot> {
  await Promise.all(
    keys.map((queryKey) => queryClient.cancelQueries({ queryKey }))
  );
  return keys.map((queryKey) => ({
    queryKey,
    data: queryClient.getQueryData(queryKey),
  }));
}

function restoreSnapshot(
  queryClient: QueryClient,
  snapshot: CacheSnapshot
): void {
  for (const entry of snapshot) {
    queryClient.setQueryData(entry.queryKey, entry.data);
  }
}

// Optimistic rows carry a negative id until the server's real one arrives
// on the reconciling refetch, so they never collide with real ids.
let optimisticIdCounter = -1;
function nextOptimisticId(): number {
  return optimisticIdCounter--;
}

export function useCreateGroupMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: fetchers.createGroup,
    onMutate: async (payload): Promise<CacheSnapshot> => {
      const listKey = makeQueryKeyFor.groupsList();
      const snapshot = await snapshotAndCancel(queryClient, [listKey]);
      const optimisticGroup: PermissionsGroup = {
        id: nextOptimisticId(),
        type: payload.type,
        label: payload.label,
        entries_count: payload.values.length,
      };
      queryClient.setQueryData<PermissionsGroup[]>(listKey, (list) => [
        ...(list ?? []),
        optimisticGroup,
      ]);
      return snapshot;
    },
    onSuccess: (group) => toastStore.success(`Group "${group.label}" created.`),
    onError: (error, _payload, context) => {
      if (context) restoreSnapshot(queryClient, context);
      toastStore.error(error.message, { title: "Could not create group" });
    },
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
    // The list shows label and type, so patch it in place right away.
    onMutate: async (vars): Promise<CacheSnapshot> => {
      const listKey = makeQueryKeyFor.groupsList();
      const snapshot = await snapshotAndCancel(queryClient, [listKey]);
      queryClient.setQueryData<PermissionsGroup[]>(listKey, (list) =>
        (list ?? []).map((group) =>
          group.id === vars.id
            ? { ...group, label: vars.payload.label, type: vars.payload.type }
            : group
        )
      );
      return snapshot;
    },
    onSuccess: (group) => toastStore.success(`Group "${group.label}" updated.`),
    onError: (error, _vars, context) => {
      if (context) restoreSnapshot(queryClient, context);
      toastStore.error(error.message, { title: "Could not update group" });
    },
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
    // Drop the row immediately. The confirm dialog has already closed.
    onMutate: async (id): Promise<CacheSnapshot> => {
      const listKey = makeQueryKeyFor.groupsList();
      const snapshot = await snapshotAndCancel(queryClient, [listKey]);
      queryClient.setQueryData<PermissionsGroup[]>(listKey, (list) =>
        (list ?? []).filter((group) => group.id !== id)
      );
      return snapshot;
    },
    // Delete toasts live at the call site. Here we only roll back.
    onError: (_error, _id, context) => {
      if (context) restoreSnapshot(queryClient, context);
    },
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
    // Show a name-only stub row now. The reconciling refetch fills in
    // the email, username, and account details the server resolves.
    onMutate: async (vars): Promise<CacheSnapshot> => {
      const membersKey = makeQueryKeyFor.groupMembers(vars.groupId);
      const snapshot = await snapshotAndCancel(queryClient, [membersKey]);
      const isLocal = "localUserId" in vars;
      const optimisticMember: GroupMember = {
        userId: isLocal ? vars.localUserId : nextOptimisticId(),
        name: vars.name,
        email: "",
        username: isLocal ? "" : vars.remoteUserId,
        userType: isLocal ? "Local" : "Remote",
        createdAt: null,
      };
      queryClient.setQueryData<GroupMember[]>(membersKey, (list) => [
        ...(list ?? []),
        optimisticMember,
      ]);
      return snapshot;
    },
    onError: (error, _vars, context) => {
      if (context) restoreSnapshot(queryClient, context);
      toastStore.error(error.message, { title: "Could not add member" });
    },
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
    onMutate: async (vars): Promise<CacheSnapshot> => {
      const membersKey = makeQueryKeyFor.groupMembers(vars.groupId);
      const snapshot = await snapshotAndCancel(queryClient, [membersKey]);
      queryClient.setQueryData<GroupMember[]>(membersKey, (list) =>
        (list ?? []).filter((member) => member.userId !== vars.userId)
      );
      return snapshot;
    },
    onError: (error, _vars, context) => {
      if (context) restoreSnapshot(queryClient, context);
      toastStore.error(error.message, { title: "Could not remove member" });
    },
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
    // Insert the value now and bump the list's count to match.
    onMutate: async (vars): Promise<CacheSnapshot> => {
      const entriesKey = makeQueryKeyFor.groupEntries(vars.groupId);
      const listKey = makeQueryKeyFor.groupsList();
      const snapshot = await snapshotAndCancel(queryClient, [
        entriesKey,
        listKey,
      ]);
      const optimisticEntry: PermissionsGroupEntry = {
        id: nextOptimisticId(),
        value: vars.value,
      };
      queryClient.setQueryData<PermissionsGroupEntry[]>(entriesKey, (list) => [
        ...(list ?? []),
        optimisticEntry,
      ]);
      queryClient.setQueryData<PermissionsGroup[]>(listKey, (list) =>
        (list ?? []).map((group) =>
          group.id === vars.groupId
            ? { ...group, entries_count: group.entries_count + 1 }
            : group
        )
      );
      return snapshot;
    },
    onError: (error, _vars, context) => {
      if (context) restoreSnapshot(queryClient, context);
      toastStore.error(error.message, { title: "Could not add value" });
    },
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
    onMutate: async (vars): Promise<CacheSnapshot> => {
      const entriesKey = makeQueryKeyFor.groupEntries(vars.groupId);
      const snapshot = await snapshotAndCancel(queryClient, [entriesKey]);
      queryClient.setQueryData<PermissionsGroupEntry[]>(entriesKey, (list) =>
        (list ?? []).map((entry) =>
          entry.id === vars.entryId ? { ...entry, value: vars.value } : entry
        )
      );
      return snapshot;
    },
    onError: (error, _vars, context) => {
      if (context) restoreSnapshot(queryClient, context);
      toastStore.error(error.message, { title: "Could not update value" });
    },
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
    // Drop the value now and lower the list's count to match.
    onMutate: async (vars): Promise<CacheSnapshot> => {
      const entriesKey = makeQueryKeyFor.groupEntries(vars.groupId);
      const listKey = makeQueryKeyFor.groupsList();
      const snapshot = await snapshotAndCancel(queryClient, [
        entriesKey,
        listKey,
      ]);
      queryClient.setQueryData<PermissionsGroupEntry[]>(entriesKey, (list) =>
        (list ?? []).filter((entry) => entry.id !== vars.entryId)
      );
      queryClient.setQueryData<PermissionsGroup[]>(listKey, (list) =>
        (list ?? []).map((group) =>
          group.id === vars.groupId
            ? { ...group, entries_count: Math.max(0, group.entries_count - 1) }
            : group
        )
      );
      return snapshot;
    },
    onError: (error, _vars, context) => {
      if (context) restoreSnapshot(queryClient, context);
      toastStore.error(error.message, { title: "Could not remove value" });
    },
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
