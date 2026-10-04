import { PERM } from "@/types";
import type { PermissionLevel } from "@/types";

export function toNoAccessLevelId(levels: PermissionLevel[]): number | null {
  return levels.find((level) => level.level === PERM.NOPERM)?.id ?? null;
}
