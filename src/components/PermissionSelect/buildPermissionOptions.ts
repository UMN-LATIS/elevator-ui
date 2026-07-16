import type { PermissionLevel } from "@/types";

export interface PermissionSelectOption {
  id: number;
  label: string;
  // the numeric strength (a PERM value), shown as the secondary number and
  // driving the dot color
  level: number;
}

interface BuildPermissionOptionsSettings {
  // Level 0 (noperm) is omitted by default: grants only add access under
  // max-merge resolution, so creating a level-0 rule does nothing. An
  // editor that cannot delete a rule offers it to revoke one in place.
  includesNoPermissions?: boolean;
}

export function buildPermissionOptions(
  levels: PermissionLevel[],
  { includesNoPermissions = false }: BuildPermissionOptionsSettings = {}
): PermissionSelectOption[] {
  const offeredLevels = includesNoPermissions
    ? levels
    : levels.filter((level) => level.level > 0);

  return offeredLevels.map((level) => ({
    id: level.id,
    label: level.label,
    level: level.level,
  }));
}
