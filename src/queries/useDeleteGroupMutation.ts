import { useMutation, useQueryClient } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { PERMISSIONS_GROUPS_QUERY_KEY } from "./queryKeys";
import type { PermissionsGroup } from "@/types";

export function useDeleteGroupMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: PermissionsGroup['id']) => fetchers.deleteGroup(id),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<PermissionsGroup[]>(
        [PERMISSIONS_GROUPS_QUERY_KEY],
        (groups = []) => groups.filter((g) => g.id !== id)
      );
    },
  });
}
