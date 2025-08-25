import { useInstanceQuery } from "@/queries/useInstanceQuery";
import { User } from "@/types";
import { computed } from "vue";
import * as fetchers from "@/api/fetchers";
import { INSTANCE_QUERY_KEY } from "@/queries/queryKeys";
import { QueryClient } from "@tanstack/vue-query";
import { selectCurrentUserFromResponse } from "@/helpers/selectCurrentUserFromResponse";

export const useCurrentUser = () => {
  const {
    data: instanceData,
    isLoading,
    isError,
    isSuccess,
    status: queryStatus,
  } = useInstanceQuery();

  const currentUser = computed((): User | null => {
    return selectCurrentUserFromResponse(instanceData.value);
  });

  return {
    currentUser,
    isLoading,
    isError,
    isSuccess,
    queryStatus,
  };
};

/**
 * Non-composable version of useCurrentUser() for router guards and other non-Vue contexts.
 * Uses the same cache as useCurrentUser().
 */
export async function getCurrentUser(queryClient: QueryClient): Promise<User | null> {
  try {
    const instanceData = await queryClient.ensureQueryData({
      queryKey: [INSTANCE_QUERY_KEY],
      queryFn: fetchers.fetchInstanceNav,
      staleTime: 5 * 60 * 1000,
    });

    return selectCurrentUserFromResponse(instanceData);
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}
