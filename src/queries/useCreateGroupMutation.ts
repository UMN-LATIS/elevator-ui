import { useMutation, useQueryClient } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { PERMISSIONS_GROUPS_QUERY_KEY } from "./queryKeys";
import { useToastStore } from "@/stores/toastStore";
import type { PermissionsGroup } from "@/types";

export function useCreateGroupMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: fetchers.createGroup,
    onSuccess: (group) => {
      // The server returns the new group, so append it to the cache instead
      // of invalidating — no refetch. The list is sorted in the component.
      queryClient.setQueryData<PermissionsGroup[]>(
        [PERMISSIONS_GROUPS_QUERY_KEY],
        (groups = []) => [...groups, group]
      );
      toastStore.addToast({
        message: `Group "${group.label}" created.`,
        variant: "success",
      });
    },
    onError: (error) => {
      toastStore.addToast({
        title: "Could not create group",
        message: error.message ?? "Something went wrong. Unknown error.",
        variant: "error",
        duration: Infinity,
      });
    },
  });
}
