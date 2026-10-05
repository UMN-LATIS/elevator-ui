import type {
  CollectionGrant,
  GroupTypeDetails,
  InstanceGrant,
  PermissionLevel,
  PermissionsGroup,
} from "@/types";
import type { RuleScope } from "./ruleQueries";

export const ALL_COLLECTIONS_LABEL = "All Collections";

// Grant ids repeat across the two scopes, so a row
// id combines the scope and the grant id.
export function permissionRowId(scope: RuleScope, grantId: number): string {
  return `${scope}-${grantId}`;
}

// One row of the permissions table: a grant joined with its group.
export interface PermissionRow {
  id: string;
  scope: RuleScope;
  grantId: number;
  // null means the instance scope: every collection
  collectionId: number | null;
  group: PermissionsGroup;
  // the display columns, split out so the table can sort and search them
  groupLabel: string;
  typeLabel: string;
  collectionLabel: string;
  permissionLabel: string;
  permissionLevelId: number;
  permissionLevelNumber: number;
}

export interface GroupRow {
  id: number;
  group: PermissionsGroup;
  groupLabel: string;
  typeLabel: string;
  permissionCount: number;
}

export interface PermissionsPageRows {
  permissionRows: PermissionRow[];
  groupRows: GroupRow[];
}

interface BuildPermissionsPageRowsInput {
  instanceGrants: InstanceGrant[];
  collectionGrants: CollectionGrant[];
  groups: PermissionsGroup[];
  permissionLevels: PermissionLevel[];
  groupTypes: GroupTypeDetails[];
  collectionTitleById: Map<number, string>;
}

/**
 * Orphaned grants (a null group or level, or a group the groups list no
 * longer holds) are inert in the backend's permission resolution, so they
 * are dropped rather than rendered broken.
 */
export function buildPermissionsPageRows({
  instanceGrants,
  collectionGrants,
  groups,
  permissionLevels,
  groupTypes,
  collectionTitleById,
}: BuildPermissionsPageRowsInput): PermissionsPageRows {
  const groupById = new Map(groups.map((group) => [group.id, group]));
  const levelById = new Map(permissionLevels.map((level) => [level.id, level]));
  const typeLabelByType = new Map(
    groupTypes.map((type) => [type.type, type.label])
  );

  const toTypeLabel = (group: PermissionsGroup): string =>
    typeLabelByType.get(group.type) ?? group.type;

  const permissionRows: PermissionRow[] = [];
  const permissionCountByGroupId = new Map<number, number>();

  const pushPermissionRow = (
    scope: RuleScope,
    grant: InstanceGrant | CollectionGrant,
    collectionId: number | null,
    collectionLabel: string
  ): void => {
    if (grant.groupId === null || grant.permissionLevelId === null) return;

    const group = groupById.get(grant.groupId);
    const level = levelById.get(grant.permissionLevelId);
    if (!group || !level) return;

    permissionCountByGroupId.set(
      group.id,
      (permissionCountByGroupId.get(group.id) ?? 0) + 1
    );
    permissionRows.push({
      id: permissionRowId(scope, grant.id),
      scope,
      grantId: grant.id,
      collectionId,
      group,
      groupLabel: group.label || group.type,
      typeLabel: toTypeLabel(group),
      collectionLabel,
      permissionLabel: level.label,
      permissionLevelId: level.id,
      permissionLevelNumber: level.level,
    });
  };

  for (const grant of instanceGrants) {
    pushPermissionRow("instance", grant, null, ALL_COLLECTIONS_LABEL);
  }

  for (const grant of collectionGrants) {
    if (grant.collectionId === null) continue;
    pushPermissionRow(
      "collection",
      grant,
      grant.collectionId,
      collectionTitleById.get(grant.collectionId) ??
        `Collection ${grant.collectionId}`
    );
  }

  const groupRows: GroupRow[] = groups.map((group) => ({
    id: group.id,
    group,
    groupLabel: group.label || group.type,
    typeLabel: toTypeLabel(group),
    permissionCount: permissionCountByGroupId.get(group.id) ?? 0,
  }));

  return {
    permissionRows: permissionRows.sort(byCollectionThenGroup),
    groupRows: groupRows.sort(byGroupLabel),
  };
}

// Instance-wide permissions lead, then collections in reading order.
function byCollectionThenGroup(a: PermissionRow, b: PermissionRow): number {
  const instanceFirst =
    Number(b.scope === "instance") - Number(a.scope === "instance");
  if (instanceFirst !== 0) return instanceFirst;

  const byCollection = a.collectionLabel.localeCompare(b.collectionLabel);
  if (byCollection !== 0) return byCollection;

  return byGroupLabel(a, b);
}

function byGroupLabel(
  a: { groupLabel: string },
  b: { groupLabel: string }
): number {
  return a.groupLabel.localeCompare(b.groupLabel);
}
