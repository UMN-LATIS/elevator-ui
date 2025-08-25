import { ApiInstanceNavResponse, User } from "@/types";

/**
 * gets the current user data from an
 */
export function selectCurrentUserFromResponse(
  instanceNav: ApiInstanceNavResponse | null
): User | null {
  if (!instanceNav) return null;

  const {
    userId,
    userDisplayName,
    userCanCreateDrawers,
    userCanManageAssets,
    userCanSearchAndBrowse,
    userIsAdmin,
    userIsSuperAdmin,
    userIsloggedIn,
  } = instanceNav;

  // check the userId to see if a current user is logged in
  if (!userId) return null;

  return {
    id: userId,
    displayName: userDisplayName ?? "Elevator User",
    isAdmin: userIsAdmin,
    isSuperAdmin: userIsSuperAdmin,
    canManageAssets: userCanManageAssets,
    canManageDrawers: userCanCreateDrawers,
    canSearchAndBrowse: userCanSearchAndBrowse,
    isLoggedIn: userIsloggedIn,
  };
}
