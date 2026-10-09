import { keepPreviousData, useQuery } from "@tanstack/vue-query";
import { MaybeRefOrGetter, computed, toValue } from "vue";
import * as fetchers from "@/api/fetchers";
import { useCurrentUser } from "@/composables/useCurrentUser";
import { makeQueryKeysFor } from "@/helpers/makeQueryKeysFor";
import type { AdminUserListParams } from "@/types";

export const adminUserKeys = makeQueryKeysFor("adminUsers");

export function useAdminUsersQuery(
  params: MaybeRefOrGetter<AdminUserListParams>
) {
  const { currentUser } = useCurrentUser();

  return useQuery({
    queryKey: computed(() => [...adminUserKeys.list(), toValue(params)]),
    queryFn: ({ signal }) =>
      fetchers.fetchAdminUsers(toValue(params), { signal }),
    enabled: computed(() => currentUser.value?.isSuperAdmin ?? false),
    placeholderData: keepPreviousData,
  });
}
