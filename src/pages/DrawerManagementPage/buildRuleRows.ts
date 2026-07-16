import type {
  DrawerGrant,
  DrawerGrantGroup,
  ManageableDrawer,
  PermissionLevel,
} from "@/types";

export interface DrawerRuleRow {
  id: number;
  drawer: ManageableDrawer;
  group: DrawerGrantGroup;
  permission: PermissionLevel;
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
    const permission = levelById.get(grant.permissionLevelId);
    if (!drawer || !permission) continue;

    rows.push({
      id: grant.id,
      drawer,
      group: grant.group,
      permission,
    });
  }

  return rows;
}
