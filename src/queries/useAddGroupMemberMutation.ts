import { useMutation, useQueryClient } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import type { AddGroupMemberInput } from "@/api/fetchers";
import {
  GROUP_MEMBERS_QUERY_KEY,
  PERMISSIONS_GROUPS_QUERY_KEY,
} from "./queryKeys";
import { useToastStore } from "@/stores/toastStore";
import type { GroupMember } from "@/types";

export function useAddGroupMemberMutation() {
  const queryClient = useQueryClient();
  const toastStore = useToastStore();

  return useMutation({
    mutationFn: (vars: AddGroupMemberInput) => fetchers.addGroupMember(vars),
    onSuccess: (member, vars) => {
      // The server returns the fully-resolved member, so write it straight
      // into the cache instead of invalidating — no second round-trip.
      queryClient.setQueryData<GroupMember[]>(
        [GROUP_MEMBERS_QUERY_KEY, vars.groupId],
        (members = []) =>
          members.some((m) => m.userId === member.userId)
            ? members
            : [...members, member]
      );
      // The group list still needs a refresh — its member count changed.
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
