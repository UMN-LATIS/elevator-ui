import { computed } from "vue";
import { useInstanceQuery } from "@/queries/useInstanceQuery";
import { selectCurrentUserFromResponse } from "@/helpers/selectCurrentUserFromResponse";
import type { UseQueryReturnType } from "@tanstack/vue-query";

/**
 * Ensures a query has fresh data, refetching if stale or missing.
 */
export async function ensureFreshData<TData = unknown>(
  query: UseQueryReturnType<TData, Error>
): Promise<TData | null> {
  if (!query.data.value || query.isStale.value) {
    await query.refetch();
  } else {
    await query.suspense();
  }

  return query.data.value ?? null;
}

/**
 * Composable for accessing current user data with both reactive and imperative APIs
 */
export function useCurrentUser() {
  const instanceQuery = useInstanceQuery();

  // Reactive API - for components that need to react to user changes
  const currentUser = computed(() => {
    const data = instanceQuery.data.value;
    return data ? selectCurrentUserFromResponse(data) : null;
  });

  const isLoggedIn = computed(() => !!currentUser.value);
  const canManageAssets = computed(() => !!currentUser.value?.canManageAssets);
  const canManageDrawers = computed(
    () => !!currentUser.value?.canManageDrawers
  );
  const isReady = computed(() => instanceQuery.isSuccess.value);

  // Imperative API - for guards, event handlers, etc. that need fresh data
  const getCurrentUser = async () => {
    const instanceData = await ensureFreshData(instanceQuery);
    return instanceData ? selectCurrentUserFromResponse(instanceData) : null;
  };

  const requireCurrentUser = async () => {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("User is not authenticated");
    }
    return user;
  };

  return {
    // Reactive values
    currentUser,
    isLoggedIn,
    canManageAssets,
    canManageDrawers,
    isReady,

    // Imperative functions
    getCurrentUser,
    requireCurrentUser,

    // Query instance for advanced use cases
    instanceQuery,
  };
}
