import type {
  DrawerGrant,
  DrawerGrantGroup,
  GroupTypeDetails,
  PermissionLevel,
  PermissionsGroup,
} from "@/types";

// The label to fall back on when the level catalog names no level 0.
const NO_ACCESS = "No access";

// One row of the sharing table: a group, and what it can do on the
// drawer being managed. A group the caller owns has a row whether or not
// it holds a rule, so the table doubles as the list of groups to share
// with.
export interface GroupAccessRow {
  // the group's id, since a row is a group for as long as it exists
  id: number;
  group: DrawerGrantGroup;
  // the two text columns, split out so the table can sort and search them
  groupLabel: string;
  permissionLabel: string;
  typeLabel: string;
  // the rule granting this group access, or null when it holds none
  grantId: number | null;
  permissionLevelId: number | null;
  // 0 when the group reaches nothing on this drawer
  permissionLevelNumber: number;
}

interface BuildGroupAccessRowsInput {
  grants: DrawerGrant[];
  ownGroups: PermissionsGroup[];
  drawerId: number;
  permissionLevels: PermissionLevel[];
  groupTypes: GroupTypeDetails[];
}

/**
 * The groups that can reach the drawer being managed, or could, with the
 * ones that reach it first and the rest, by name, under them.
 *
 * Rows come from two places: every rule on this drawer, which can name a
 * group belonging to anyone, and every group the caller owns, which gets
 * a row with no access rather than no row at all.
 *
 * A level 0 rule and no rule read the same, since access resolves to the
 * highest matching level and 0 never wins. Both leave the row with no
 * access, and only `grantId` tells them apart.
 *
 * Orphaned grants (a null group or level) are inert in the backend's
 * permission resolution, so they are dropped rather than rendered broken.
 */
export function buildGroupAccessRows({
  grants,
  ownGroups,
  drawerId,
  permissionLevels,
  groupTypes,
}: BuildGroupAccessRowsInput): GroupAccessRow[] {
  const levelById = new Map(permissionLevels.map((level) => [level.id, level]));
  const labelByType = new Map(
    groupTypes.map((type) => [type.type, type.label])
  );
  const noAccessLabel =
    permissionLevels.find((level) => level.level === 0)?.label ?? NO_ACCESS;

  const rows: GroupAccessRow[] = [];
  const rowedGroupIds = new Set<number>();

  for (const grant of grants) {
    if (grant.drawerId !== drawerId || !grant.group) continue;
    if (grant.permissionLevelId === null) continue;

    const level = levelById.get(grant.permissionLevelId);
    if (!level) continue;

    rowedGroupIds.add(grant.group.id);
    rows.push({
      id: grant.group.id,
      group: grant.group,
      groupLabel: grant.group.label || grant.group.type,
      typeLabel: labelByType.get(grant.group.type) ?? grant.group.type,
      permissionLabel: level.level > 0 ? level.label : noAccessLabel,
      grantId: grant.id,
      permissionLevelId: level.id,
      permissionLevelNumber: level.level,
    });
  }

  // A group the caller owns but has not shared this drawer with, which
  // needs a row to become shareable without hunting for it elsewhere.
  for (const group of ownGroups) {
    if (rowedGroupIds.has(group.id)) continue;

    rows.push({
      id: group.id,
      group: {
        id: group.id,
        label: group.label,
        type: group.type,
        entries_count: group.entries_count,
        // the list holds the caller's own groups and nobody else's
        ownedByCurrentUser: true,
        ownerName: null,
      },
      groupLabel: group.label || group.type,
      typeLabel: labelByType.get(group.type) ?? group.type,
      permissionLabel: noAccessLabel,
      grantId: null,
      permissionLevelId: null,
      permissionLevelNumber: 0,
    });
  }

  return rows.sort(byAccessThenName);
}

// Who reaches the drawer is what the table is for, so those groups lead
// and the rest wait below in the order a reader would look them up.
function byAccessThenName(a: GroupAccessRow, b: GroupAccessRow): number {
  const hasAccess =
    Number(b.permissionLevelNumber > 0) - Number(a.permissionLevelNumber > 0);
  if (hasAccess !== 0) return hasAccess;

  return a.groupLabel.localeCompare(b.groupLabel);
}
