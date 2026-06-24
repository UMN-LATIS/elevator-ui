import { useQuery } from "@tanstack/vue-query";
import { MaybeRefOrGetter, computed, toValue } from "vue";
import { fetchGroupMembers } from "@/api/fetchers";
import { GroupMember } from "@/types";
import { GROUP_MEMBERS_QUERY_KEY } from "./queryKeys";

// A User group's members, resolved to names. Pass `enabled` so the list is
// fetched only when its group is expanded, not for every group at once.
export function useGroupMembersQuery(
  groupId: MaybeRefOrGetter<number>,
  options?: { enabled?: MaybeRefOrGetter<boolean> }
) {
  return useQuery({
    queryKey: computed(() => [GROUP_MEMBERS_QUERY_KEY, toValue(groupId)]),
    queryFn: () => fetchGroupMembers(toValue(groupId)),
    placeholderData: () => [] as GroupMember[],
    enabled: computed(() => toValue(options?.enabled) ?? true),
  });
}
