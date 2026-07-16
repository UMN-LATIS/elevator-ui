import type { DrawerGrant, ManageableDrawer, PermissionLevel } from "@/types";
import { toDrawerTitle } from "./toDrawerTitle";

// One row of the Rules table: a drawer group's permission level on one
// drawer the caller manages. Grants come from a single resource, so the
// grant id alone identifies a row.
export interface DrawerRuleRow {
  id: number;
  drawerId: number;
  drawerTitle: string;
  groupId: number;
  groupLabel: string;
  // Managing a drawer carries the right to edit and revoke grants on it,
  // including grants for groups owned by someone else.
  isOwnGroup: boolean;
  ownerName: string | null;
  permissionLevelId: number;
  permissionLevelNumber: number;
  permissionLabel: string;
}

interface BuildRuleRowsInput {
  grants: DrawerGrant[];
  drawers: ManageableDrawer[];
  permissionLevels: PermissionLevel[];
}

/**
 * Join grants against the drawer list and permission level catalog into
 * display-ready table rows.
 *
 * Orphaned grants (a null group, drawer, or level) are inert in the
 * backend's permission resolution, so they are dropped rather than
 * rendered broken.
 */
export function buildRuleRows({
  grants,
  drawers,
  permissionLevels,
}: BuildRuleRowsInput): DrawerRuleRow[] {
  const drawerById = new Map(drawers.map((drawer) => [drawer.id, drawer]));
  const levelById = new Map(permissionLevels.map((level) => [level.id, level]));

  const rows: DrawerRuleRow[] = [];
  for (const grant of grants) {
    if (grant.drawerId === null || grant.permissionLevelId === null) continue;
    if (!grant.group) continue;

    const drawer = drawerById.get(grant.drawerId);
    const level = levelById.get(grant.permissionLevelId);
    if (!drawer || !level) continue;

    rows.push({
      id: grant.id,
      drawerId: drawer.id,
      drawerTitle: toDrawerTitle(drawer),
      groupId: grant.group.id,
      groupLabel: grant.group.label || grant.group.type,
      isOwnGroup: grant.group.ownedByCurrentUser,
      ownerName: grant.group.ownerName,
      permissionLevelId: level.id,
      permissionLevelNumber: level.level,
      permissionLabel: level.label,
    });
  }

  return rows;
}
