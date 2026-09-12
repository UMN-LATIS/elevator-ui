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
    canEditTemplates: instanceNav.userCanEditTemplates,
  };
}

export function useCurrentUser() {
  const instanceNav = useInstanceNavQuery();

  const currentUser = computed((): User | null =>
    selectCurrentUser(instanceNav.data.value ?? null)
  );

  const isLoggedIn = computed((): boolean => !!currentUser.value);

  // session-level, not a property of currentUser: on a public
  // instance this is true even for anonymous visitors
  const canSearchAndBrowse = computed(
    (): boolean => instanceNav.data.value?.userCanSearchAndBrowse ?? false
  );

  return {
    currentUser,
    isLoggedIn,
    canSearchAndBrowse,
    isLoading: instanceNav.isLoading,
    isError: instanceNav.isError,
    isSuccess: instanceNav.isSuccess,
  };
}
