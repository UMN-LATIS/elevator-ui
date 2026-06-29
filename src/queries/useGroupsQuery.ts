import { useQuery } from "@tanstack/vue-query";
import { fetchGroups } from "@/api/fetchers";
import { PERMISSIONS_GROUPS_QUERY_KEY } from "./queryKeys";

export function useGroupsQuery() {
  return useQuery({
    queryKey: [PERMISSIONS_GROUPS_QUERY_KEY],
    queryFn: fetchGroups,
  });
}
