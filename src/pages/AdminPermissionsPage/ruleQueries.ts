import { queryOptions, useMutation, useQueryClient } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { useToastStore } from "@/stores/toastStore";
import type { CollectionGrant, InstanceGrant } from "@/types";

// A "rule" is one row of the Rules table. The backend stores it as a
// "grant": an instance grant ("All Collections") or a collection grant.

// Key scheme matches groupQueries: resource then kind, so item keys can
// branch off later without invalidating the lists.
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

export type RuleScope = "instance" | "collection";

function grantsListKeyFor(scope: RuleScope) {
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

// makePlanForSavingRule builds the step list, useSaveRuleMutation runs it.
export type RuleSaveStep =
  | { action: "create"; rule: RuleInput }
  | { action: "update"; grantId: number; rule: RuleInput }
  | { action: "delete"; grant: GrantIdentifier };

function getScopeTouchedBy(step: RuleSaveStep): RuleScope {
  if (step.action === "delete") {
    return step.grant.scope;
  }
  return step.rule.collectionId === null ? "instance" : "collection";
}

export function useSaveRuleMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    // Steps must run in order: the plan relies on write-before-delete.
    mutationFn: async (steps: RuleSaveStep[]) => {
      let savedGrant: InstanceGrant | CollectionGrant | null = null;
      for (const step of steps) {
        if (step.action === "create") {
          savedGrant = await createGrant(step.rule);
        } else if (step.action === "update") {
          savedGrant = await updateGrant(step.grantId, step.rule);
        } else {
          await deleteGrant(step.grant);
        }
      }
      return savedGrant;
    },
    onSuccess: (_grant, steps) => {
      const isCreateOnly = steps.length === 1 && steps[0]?.action === "create";
      toastStore.addToast({
        message: isCreateOnly ? "Rule created." : "Rule updated.",
        variant: "success",
      });
    },
    onError: useErrorToast("Could not save rule"),
    onSettled: (_grant, _error, steps) => {
      const staleScopes = new Set(steps.map(getScopeTouchedBy));
      return Promise.all(
        [...staleScopes].map((scope) =>
          queryClient.invalidateQueries({ queryKey: grantsListKeyFor(scope) })
        )
      );
    },
  });
}

// Toasts for delete live at the call site, next to the confirm dialog.
export function useDeleteRuleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GrantIdentifier) => deleteGrant(input),
    onSettled: (_data, _error, input) =>
      queryClient.invalidateQueries({
        queryKey: grantsListKeyFor(input.scope),
      }),
  });
}
