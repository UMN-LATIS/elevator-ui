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
    canManageAssets: instanceNav.userCanManageAssets,
    canManageDrawers: instanceNav.userCanCreateDrawers,
  };
}

export function useCurrentUser() {
  const instanceNav = useInstanceNavQuery();

  const currentUser = computed(() =>
    selectCurrentUser(instanceNav.data.value ?? null)
  );

  const isLoggedIn = computed(() => currentUser.value !== null);

  return {
    currentUser,
    isLoggedIn,
    isLoading: instanceNav.isLoading,
    isError: instanceNav.isError,
    isSuccess: instanceNav.isSuccess,
  };
}
