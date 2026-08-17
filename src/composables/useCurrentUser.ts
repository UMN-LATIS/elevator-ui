import { useInstanceNavQuery } from "@/queries/useInstanceNavQuery";
import { ApiInstanceNavResponse, User } from "@/types";
import { computed } from "vue";

function selectCurrentUser(
  instanceNav: ApiInstanceNavResponse | null
): User | null {
  if (!instanceNav?.userId) {
    return null;
  }

  return {
    id: instanceNav.userId,
    displayName: instanceNav.userDisplayName ?? `User ${instanceNav.userId}`,
    isAdmin: instanceNav.userIsAdmin,
    isSuperAdmin: instanceNav.userIsSuperAdmin,
    canSearchAndBrowse: instanceNav.userCanSearchAndBrowse,
    canManageAssets: instanceNav.userCanManageAssets,
    canManageDrawers: instanceNav.userCanCreateDrawers,
  };
}

export function useCurrentUser() {
  const instanceNav = useInstanceNavQuery();

  const currentUser = computed((): User | null =>
    selectCurrentUser(instanceNav.data.value ?? null)
  );

  return {
    currentUser,
    isLoading: instanceNav.isLoading,
    isError: instanceNav.isError,
    isSuccess: instanceNav.isSuccess,
  };
}
