import { queryOptions, useMutation, useQueryClient } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { useToastStore } from "@/stores/toastStore";
import type { CollectionGrant, InstanceGrant } from "@/types";

// A "rule" in the UI is a "grant" in the backend: instance or collection scope.
export const makeQueryKeyFor = {
  instanceGrantsList: () => ["instanceGrants", "list"] as const,
  collectionGrantsList: () => ["collectionGrants", "list"] as const,
  permissionLevels: () => ["permissionLevels"] as const,
};

export function instanceGrantsQuery() {
  return queryOptions({
    queryKey: makeQueryKeyFor.instanceGrantsList(),
    queryFn: fetchers.fetchInstanceGrants,
  });
}

export function collectionGrantsQuery() {
  return queryOptions({
    queryKey: makeQueryKeyFor.collectionGrantsList(),
    queryFn: fetchers.fetchCollectionGrants,
  });
}

export function permissionLevelsQuery() {
  return queryOptions({
    queryKey: makeQueryKeyFor.permissionLevels(),
    queryFn: fetchers.fetchPermissionLevels,
    // Levels never change over a page's life, so fetch once and reuse.
    staleTime: Infinity,
  });
}

export type RuleScope = "instance" | "collection";

function queryKeyForScope(scope: RuleScope) {
  return scope === "instance"
    ? makeQueryKeyFor.instanceGrantsList()
    : makeQueryKeyFor.collectionGrantsList();
}

// A rule as the form submits it. A null collectionId means
// "All Collections".
export type RuleInput = {
  collectionId: number | null;
  groupId: number;
  permissionLevelId: number;
};

// Grant ids repeat across the two scopes, so identity needs both.
export type GrantIdentifier = {
  scope: RuleScope;
  grantId: number;
};

function createGrant(
  input: RuleInput
): Promise<InstanceGrant | CollectionGrant> {
  return input.collectionId === null
    ? fetchers.createInstanceGrant({
        groupId: input.groupId,
        permissionLevelId: input.permissionLevelId,
      })
    : fetchers.createCollectionGrant({
        collectionId: input.collectionId,
        groupId: input.groupId,
        permissionLevelId: input.permissionLevelId,
      });
}

function updateGrant(
  grantId: number,
  input: RuleInput
): Promise<InstanceGrant | CollectionGrant> {
  return input.collectionId === null
    ? fetchers.updateInstanceGrant(grantId, {
        groupId: input.groupId,
        permissionLevelId: input.permissionLevelId,
      })
    : fetchers.updateCollectionGrant(grantId, {
        collectionId: input.collectionId,
        groupId: input.groupId,
        permissionLevelId: input.permissionLevelId,
      });
}

function deleteGrant(grant: GrantIdentifier): Promise<void> {
  return grant.scope === "instance"
    ? fetchers.deleteInstanceGrant(grant.grantId)
    : fetchers.deleteCollectionGrant(grant.grantId);
}

export type SaveRuleInput =
  | { kind: "create"; rule: RuleInput }
  | { kind: "update"; grantId: number; rule: RuleInput };

// The cached grant lists the optimistic handlers patch. Both scopes share
// an `id`, so removals and level edits touch them the same way.
type CachedGrantList = (InstanceGrant | CollectionGrant)[];

// Snapshot kept between onMutate and onError so a failed request rolls the
// cache back to what the server last confirmed.
type OptimisticRollback = {
  queryKey: ReturnType<typeof queryKeyForScope>;
  previous: CachedGrantList | undefined;
};

export function useSaveRuleMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: (input: SaveRuleInput) =>
      input.kind === "create"
        ? createGrant(input.rule)
        : updateGrant(input.grantId, input.rule),
    // Editing only swaps a level, so patch the cached grant right away.
    // Create waits for the server, which assigns the new id.
    onMutate: async (
      input: SaveRuleInput
    ): Promise<OptimisticRollback | undefined> => {
      if (input.kind !== "update") return undefined;
      const queryKey = queryKeyForScope(
        input.rule.collectionId === null ? "instance" : "collection"
      );
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CachedGrantList>(queryKey);
      queryClient.setQueryData<CachedGrantList>(queryKey, (list) =>
        (list ?? []).map((grant) =>
          grant.id === input.grantId
            ? { ...grant, permissionLevelId: input.rule.permissionLevelId }
            : grant
        )
      );
      return { queryKey, previous };
    },
    onSuccess: (_grant, input) =>
      toastStore.success(
        input.kind === "create" ? "Rule created." : "Rule updated."
      ),
    onError: (error, _input, context) => {
      if (context) queryClient.setQueryData(context.queryKey, context.previous);
      toastStore.error(error.message, { title: "Could not save rule" });
    },
    // Only the list the rule lives in goes stale.
    onSettled: (_grant, _error, input) =>
      queryClient.invalidateQueries({
        queryKey: queryKeyForScope(
          input.rule.collectionId === null ? "instance" : "collection"
        ),
      }),
  });
}

// Toasts for delete live at the call site, next to the confirm dialog.
export function useDeleteRuleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GrantIdentifier) => deleteGrant(input),
    // Drop the row immediately. The confirm dialog has already closed.
    onMutate: async (input: GrantIdentifier): Promise<OptimisticRollback> => {
      const queryKey = queryKeyForScope(input.scope);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CachedGrantList>(queryKey);
      queryClient.setQueryData<CachedGrantList>(queryKey, (list) =>
        (list ?? []).filter((grant) => grant.id !== input.grantId)
      );
      return { queryKey, previous };
    },
    onError: (error, _input, context) => {
      const toastStore = useToastStore();
      toastStore.error(error.message, { title: "Delete failed" });
      if (context) queryClient.setQueryData(context.queryKey, context.previous);
    },
    onSettled: (_data, _error, input) =>
      queryClient.invalidateQueries({
        queryKey: queryKeyForScope(input.scope),
      }),
  });
}
