import { useMutation, useQueryClient } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { PERMISSIONS_GROUPS_QUERY_KEY } from "./queryKeys";
import { useToastStore } from "@/stores/toastStore";

export function useCreateGroupMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: fetchers.createGroup,
    onSuccess: (group) => {
      queryClient.invalidateQueries({
        queryKey: [PERMISSIONS_GROUPS_QUERY_KEY],
      });
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
