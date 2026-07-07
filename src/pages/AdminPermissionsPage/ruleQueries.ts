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
        queryKey:
          input.collectionId === null
            ? makeQueryKeyFor.instanceGrantsList()
            : makeQueryKeyFor.collectionGrantsList(),
      }),
  });
}
