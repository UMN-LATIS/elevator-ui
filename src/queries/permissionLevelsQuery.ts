import { queryOptions } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";

// The permission level catalog is read by the instance admin page and by
// the drawer management page, whose users are not admins, so it lives
// here rather than in either page's own query module.
export function permissionLevelsQuery() {
  return queryOptions({
    queryKey: ["permissionLevels"] as const,
    queryFn: fetchers.fetchPermissionLevels,
    // Levels never change over a page's life, so fetch once and reuse.
    staleTime: Infinity,
  });
}
