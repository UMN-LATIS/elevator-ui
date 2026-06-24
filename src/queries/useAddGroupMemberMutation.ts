import { useMutation, useQueryClient } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import {
  GROUP_MEMBERS_QUERY_KEY,
  PERMISSIONS_GROUPS_QUERY_KEY,
} from "./queryKeys";
import { useToastStore } from "@/stores/toastStore";

export function useAddGroupMemberMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: (vars: { groupId: number; userId: number }) =>
      fetchers.addGroupMember(vars.groupId, vars.userId),
    onSuccess: (member, vars) => {
      // refresh the member list and the group list (its count changed)
      queryClient.invalidateQueries({
        queryKey: [GROUP_MEMBERS_QUERY_KEY, vars.groupId],
      });
      queryClient.invalidateQueries({
        queryKey: [PERMISSIONS_GROUPS_QUERY_KEY],
      });
      toastStore.addToast({
        message: `${member.name} added.`,
        variant: "success",
      });
    },
    onError: (error) => {
      toastStore.addToast({
        title: "Could not add member",
        message: error.message ?? "Something went wrong. Unknown error.",
        variant: "error",
        duration: Infinity,
      });
    },
  });
}
