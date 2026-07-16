import type { PermissionLevel } from "@/types";

export interface PermissionSelectOption {
  id: number;
  label: string;
  // the numeric strength (a PERM value), shown as the secondary number and
  // driving the dot color
  level: number;
}

// Level 0 (noperm) is omitted: grants only add access under max-merge
// resolution, so a level-0 rule does nothing.
export function buildPermissionOptions(
  levels: PermissionLevel[]
): PermissionSelectOption[] {
  return levels
    .filter((level) => level.level > 0)
    .map((level) => ({ id: level.id, label: level.label, level: level.level }));
}
