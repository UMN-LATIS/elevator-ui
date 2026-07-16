import { queryOptions, useMutation, useQueryClient } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { useToastStore } from "@/stores/toastStore";
import { makeQueryKeysFor } from "@/helpers/makeQueryKeysFor";
import type { CollectionGrant, InstanceGrant } from "@/types";

// A "rule" in the UI is a "grant" in the backend: instance or collection scope.
export const makeQueryKeyFor = {
  instanceGrantsList: makeQueryKeysFor("instanceGrants").list,
  collectionGrantsList: makeQueryKeysFor("collectionGrants").list,
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

// Mutations reconcile by invalidating in onSettled instead of patching the
// cache optimistically. Call sites render in-flight feedback from isPending,
// which stays true until the promise returned by onSettled (the reconciling
// refetch) resolves, so pending markers hold until fresh data lands.

export function useSaveRuleMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: (input: SaveRuleInput) =>
      input.kind === "create"
        ? createGrant(input.rule)
        : updateGrant(input.grantId, input.rule),
    onSuccess: (_grant, input) =>
      toastStore.success(
        input.kind === "create" ? "Rule created." : "Rule updated."
      ),
    onError: (error) =>
      toastStore.error(error.message, { title: "Could not save rule" }),
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
    onSettled: (_data, _error, input) =>
      queryClient.invalidateQueries({
        queryKey: queryKeyForScope(input.scope),
      }),
  });
}
