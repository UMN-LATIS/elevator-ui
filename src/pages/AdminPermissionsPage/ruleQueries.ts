import { queryOptions, useMutation, useQueryClient } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { useToastStore } from "@/stores/toastStore";

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

// The unified rule input. A null collectionId means "All Collections",
// which the backend stores as an instance grant.
export type CreateRuleInput = {
  collectionId: number | null;
  groupId: number;
  permissionLevelId: number;
};

export function useCreateRuleMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: (input: CreateRuleInput) =>
      input.collectionId === null
        ? fetchers.createInstanceGrant(input)
        : fetchers.createCollectionGrant({
            ...input,
            collectionId: input.collectionId,
          }),
    onSuccess: () =>
      toastStore.addToast({
        message: "Rule created.",
        variant: "success",
      }),
    onError: useErrorToast("Could not create rule"),
    // Only the list the rule landed in goes stale.
    onSettled: (_grant, _error, input) =>
      queryClient.invalidateQueries({
        queryKey: grantsListKeyFor(
          input.collectionId === null ? "instance" : "collection"
        ),
      }),
  });
}

type RuleScope = "instance" | "collection";

function grantsListKeyFor(scope: RuleScope) {
  return scope === "instance"
    ? makeQueryKeyFor.instanceGrantsList()
    : makeQueryKeyFor.collectionGrantsList();
}

// An edit re-sends the whole rule plus where it currently lives, so the
// mutation can tell an in-place level change from a move.
export type UpdateRuleInput = {
  original: {
    scope: RuleScope;
    grantId: number;
    collectionId: number | null;
    groupId: number;
  };
  collectionId: number | null;
  groupId: number;
  permissionLevelId: number;
};

export function useUpdateRuleMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: async (input: UpdateRuleInput) => {
      const { original } = input;
      const isSamePlace =
        input.collectionId === original.collectionId &&
        input.groupId === original.groupId;

      if (isSamePlace) {
        const payload = { permissionLevelId: input.permissionLevelId };
        return original.scope === "instance"
          ? fetchers.updateInstanceGrant(original.grantId, payload)
          : fetchers.updateCollectionGrant(original.grantId, payload);
      }

      // A moved rule changes rows (and possibly tables), so compose it:
      // create at the destination first so a failure (e.g. a duplicate
      // there) leaves the original rule untouched. If the trailing
      // delete fails both rules stay visible in the table, and grants
      // max-merge, so access never dips below either rule meanwhile.
      const created =
        input.collectionId === null
          ? await fetchers.createInstanceGrant({
              groupId: input.groupId,
              permissionLevelId: input.permissionLevelId,
            })
          : await fetchers.createCollectionGrant({
              collectionId: input.collectionId,
              groupId: input.groupId,
              permissionLevelId: input.permissionLevelId,
            });

      if (original.scope === "instance") {
        await fetchers.deleteInstanceGrant(original.grantId);
      } else {
        await fetchers.deleteCollectionGrant(original.grantId);
      }

      return created;
    },
    onSuccess: () =>
      toastStore.addToast({
        message: "Rule updated.",
        variant: "success",
      }),
    onError: useErrorToast("Could not update rule"),
    // A move can touch both lists (source and destination scopes differ).
    onSettled: (_grant, _error, input) => {
      const destinationScope: RuleScope =
        input.collectionId === null ? "instance" : "collection";
      const scopes = new Set<RuleScope>([
        input.original.scope,
        destinationScope,
      ]);
      return Promise.all(
        [...scopes].map((scope) =>
          queryClient.invalidateQueries({ queryKey: grantsListKeyFor(scope) })
        )
      );
    },
  });
}

export type DeleteRuleInput = {
  scope: RuleScope;
  grantId: number;
};

// Toasts for delete live at the call site, next to the confirm dialog.
export function useDeleteRuleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeleteRuleInput) =>
      input.scope === "instance"
        ? fetchers.deleteInstanceGrant(input.grantId)
        : fetchers.deleteCollectionGrant(input.grantId),
    onSettled: (_data, _error, input) =>
      queryClient.invalidateQueries({
        queryKey: grantsListKeyFor(input.scope),
      }),
  });
}
