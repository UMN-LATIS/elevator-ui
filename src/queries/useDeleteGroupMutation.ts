import { useMutation, useQueryClient } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { PERMISSIONS_GROUPS_QUERY_KEY } from "./queryKeys";
import { useToastStore } from "@/stores/toastStore";

export function useDeleteGroupMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    // the delete response is empty, so carry the label for the toast
    mutationFn: (vars: { id: number; label: string }) =>
      fetchers.deleteGroup(vars.id),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: [PERMISSIONS_GROUPS_QUERY_KEY],
      });
      toastStore.addToast({
        message: `Group "${vars.label}" deleted.`,
        variant: "success",
      });
    },
    onError: (error) => {
      toastStore.addToast({
        title: "Could not delete group",
        message: error.message ?? "Something went wrong. Unknown error.",
        variant: "error",
        duration: Infinity,
      });
    },
  });
}
