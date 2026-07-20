import type { PermissionLevel } from "@/types";

export interface PermissionSelectOption {
  id: number;
  label: string;
  // the numeric strength (a PERM value), shown as the secondary number and
  // driving the dot color
  level: number;
}

export function buildPermissionOptions(
  levels: PermissionLevel[]
): PermissionSelectOption[] {
  return levels.map((level) => ({
    id: level.id,
    label: level.label,
    level: level.level,
  }));
}
