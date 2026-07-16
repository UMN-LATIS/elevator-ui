import { PERM } from "@/types";

// Tailwind dot colors for permissions
const dotClassByLevel: Record<number, string> = {
  [PERM.NOPERM]: "bg-gray-500",
  // read
  [PERM.SEARCH]: "bg-green-500",
  [PERM.VIEWDERIVATIVES]: "bg-green-500",
  [PERM.DERIVATIVES_GROUP_2]: "bg-green-500",
  // write
  [PERM.CREATEDRAWERS]: "bg-yellow-500",
  [PERM.ORIGINALS]: "bg-yellow-500",
  // admin
  [PERM.ADDASSETS]: "bg-orange-500",
  [PERM.ADMIN]: "bg-red-500",
};

// levelNumber is a PermissionLevel.level, not a level id.
export function permissionDotClass(levelNumber: number): string {
  return dotClassByLevel[levelNumber] ?? "bg-black";
}
