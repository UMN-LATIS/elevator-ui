import { useMutation, useQueryClient } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { PERMISSIONS_GROUPS_QUERY_KEY } from "./queryKeys";
import { useToastStore } from "@/stores/toastStore";
import type { PermissionsGroup, UpdateGroupPayload } from "@/types";

export function useUpdateGroupMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: (vars: { id: number; payload: UpdateGroupPayload }) =>
      fetchers.updateGroup(vars.id, vars.payload),
    onSuccess: (group) => {
      // The server returns the updated group, so swap it into the cache by
      // id instead of invalidating — no refetch.
      queryClient.setQueryData<PermissionsGroup[]>(
        [PERMISSIONS_GROUPS_QUERY_KEY],
        (groups = []) => groups.map((g) => (g.id === group.id ? group : g))
      );
      toastStore.addToast({
        message: `Group "${group.label}" updated.`,
        variant: "success",
      });
    },
    onError: (error) => {
      toastStore.addToast({
        title: "Could not update group",
        message: error.message ?? "Something went wrong. Unknown error.",
        variant: "error",
        duration: Infinity,
      });
    },
  });
}
