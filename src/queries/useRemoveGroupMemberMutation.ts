import { useMutation, useQueryClient } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import {
  GROUP_MEMBERS_QUERY_KEY,
  PERMISSIONS_GROUPS_QUERY_KEY,
} from "./queryKeys";
import { useToastStore } from "@/stores/toastStore";
import type { GroupMember } from "@/types";

export function useRemoveGroupMemberMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: (vars: { groupId: number; userId: number }) =>
      fetchers.removeGroupMember(vars.groupId, vars.userId),
    onSuccess: (_data, vars) => {
      // Drop the removed member from the cache by id instead of invalidating
      // — no refetch.
      queryClient.setQueryData<GroupMember[]>(
        [GROUP_MEMBERS_QUERY_KEY, vars.groupId],
        (members = []) => members.filter((m) => m.userId !== vars.userId)
      );
      // The group list still needs a refresh — its member count changed.
      queryClient.invalidateQueries({
        queryKey: [PERMISSIONS_GROUPS_QUERY_KEY],
      });
      toastStore.addToast({
        message: "Member removed.",
        variant: "success",
      });
    },
    onError: (error) => {
      toastStore.addToast({
        title: "Could not remove member",
        message: error.message ?? "Something went wrong. Unknown error.",
        variant: "error",
        duration: Infinity,
      });
    },
  });
}
