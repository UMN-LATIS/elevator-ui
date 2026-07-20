import { PERM } from "@/types";

interface PermissionLevelColor {
  dot: string;
  // Border at the dot's own color, over a wash of it. The wash is an
  // alpha of that color rather than a fixed tint, so it composites onto
  // the light and dark surfaces alike.
  chip: string;
}

// Tailwind only ships classes it finds spelled out, so each color names
// its own rather than interpolating a hue.
const GRAY: PermissionLevelColor = {
  dot: "bg-gray-500",
  chip: "border-gray-500 bg-gray-500/10",
};
const GREEN: PermissionLevelColor = {
  dot: "bg-green-500",
  chip: "border-green-500 bg-green-500/10",
};
const YELLOW: PermissionLevelColor = {
  dot: "bg-yellow-500",
  chip: "border-yellow-500 bg-yellow-500/10",
};
const ORANGE: PermissionLevelColor = {
  dot: "bg-orange-500",
  chip: "border-orange-500 bg-orange-500/10",
};
const RED: PermissionLevelColor = {
  dot: "bg-red-500",
  chip: "border-red-500 bg-red-500/10",
};
const UNKNOWN: PermissionLevelColor = {
  dot: "bg-black",
  chip: "border-black bg-black/10",
};

const colorByLevel: Record<number, PermissionLevelColor> = {
  [PERM.NOPERM]: GRAY,
  // read
  [PERM.SEARCH]: GREEN,
  [PERM.VIEWDERIVATIVES]: GREEN,
  [PERM.DERIVATIVES_GROUP_2]: GREEN,
  // write
  [PERM.CREATEDRAWERS]: YELLOW,
  [PERM.ORIGINALS]: YELLOW,
  // admin
  [PERM.ADDASSETS]: ORANGE,
  [PERM.ADMIN]: RED,
};

// levelNumber is a PermissionLevel.level, not a level id.
export function permissionDotClass(levelNumber: number): string {
  return (colorByLevel[levelNumber] ?? UNKNOWN).dot;
}

// Pairs with a `border` class on a chip carrying the same level.
export function permissionChipClass(levelNumber: number): string {
  return (colorByLevel[levelNumber] ?? UNKNOWN).chip;
}
