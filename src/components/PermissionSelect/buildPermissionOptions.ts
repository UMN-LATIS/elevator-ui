import type { PermissionLevel } from "@/types";

export interface PermissionSelectOption {
  id: number;
  label: string;
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
