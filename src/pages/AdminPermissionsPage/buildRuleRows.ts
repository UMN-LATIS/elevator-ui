import type {
  CollectionGrant,
  InstanceGrant,
  PermissionLevel,
  PermissionsGroup,
} from "@/types";

export const ALL_COLLECTIONS_LABEL = "All Collections";

// One row of the unified Rules table: an instance grant shown as
// "All Collections", or a collection grant.
export interface PermissionRuleRow {
  // grant ids repeat across the two scopes, so rows key on scope + id
  key: string;
  scope: "instance" | "collection";
  grantId: number;
  collectionId: number | null;
  collectionLabel: string;
  groupId: number;
  groupLabel: string;
  permissionLevelId: number;
  permissionLevelNumber: number;
  permissionLabel: string;
}

interface BuildRuleRowsInput {
  instanceGrants: InstanceGrant[];
  collectionGrants: CollectionGrant[];
  groups: PermissionsGroup[];
  permissionLevels: PermissionLevel[];
  collectionTitleById: Map<number, string>;
}

/**
 * Merge both grant resources into display-ready table rows.
 *
 * Orphaned rows (a null group, level, or collection) are inert in the
 * backend's permission resolution, so they are dropped rather than
 * rendered broken.
 */
export function buildRuleRows({
  instanceGrants,
  collectionGrants,
  groups,
  permissionLevels,
  collectionTitleById,
}: BuildRuleRowsInput): PermissionRuleRow[] {
  const groupLabelById = new Map(
    groups.map((group) => [group.id, group.label || group.type])
  );
  const levelById = new Map(permissionLevels.map((level) => [level.id, level]));

  const getLevelLabel = (levelId: number): string =>
    levelById.get(levelId)?.label ?? `Level id ${levelId}`;

  const getLevelStrength = (levelId: number): number =>
    levelById.get(levelId)?.level ?? 0;

  const rows: PermissionRuleRow[] = [];

  for (const grant of instanceGrants) {
    if (grant.groupId === null || grant.permissionLevelId === null) continue;
    rows.push({
      key: `instance-${grant.id}`,
      scope: "instance",
      grantId: grant.id,
      collectionId: null,
      collectionLabel: ALL_COLLECTIONS_LABEL,
      groupId: grant.groupId,
      groupLabel: groupLabelById.get(grant.groupId) ?? `Group ${grant.groupId}`,
      permissionLevelId: grant.permissionLevelId,
      permissionLevelNumber: getLevelStrength(grant.permissionLevelId),
      permissionLabel: getLevelLabel(grant.permissionLevelId),
    });
  }

  for (const grant of collectionGrants) {
    if (
      grant.groupId === null ||
      grant.permissionLevelId === null ||
      grant.collectionId === null
    ) {
      continue;
    }
    rows.push({
      key: `collection-${grant.id}`,
      scope: "collection",
      grantId: grant.id,
      collectionId: grant.collectionId,
      collectionLabel:
        collectionTitleById.get(grant.collectionId) ??
        `Collection ${grant.collectionId}`,
      groupId: grant.groupId,
      groupLabel: groupLabelById.get(grant.groupId) ?? `Group ${grant.groupId}`,
      permissionLevelId: grant.permissionLevelId,
      permissionLevelNumber: getLevelStrength(grant.permissionLevelId),
      permissionLabel: getLevelLabel(grant.permissionLevelId),
    });
  }

  return rows;
}
