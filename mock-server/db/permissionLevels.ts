export interface MockPermissionLevel {
  id: number;
  level: number;
  name: string;
  label: string;
}

export const PERMISSION_LEVELS: MockPermissionLevel[] = [
  { id: 3, level: 0, name: "noperm", label: "No Permissions" },
  { id: 4, level: 10, name: "search", label: "Search and Browse" },
  {
    id: 5,
    level: 20,
    name: "viewderivatives",
    label: "View Derivatives (Group 1)",
  },
  {
    id: 10,
    level: 25,
    name: "originalsWithoutDerivatives",
    label: "View Derivatives (Groups 1 & 2)",
  },
  { id: 6, level: 30, name: "createdrawers", label: "Create/Edit Drawers" },
  { id: 7, level: 40, name: "originals", label: "Download Originals" },
  { id: 8, level: 50, name: "addassets", label: "Add Assets to Instance" },
  { id: 9, level: 60, name: "admin", label: "Administer Instance" },
];

export function findPermissionLevel(
  levelId: number
): MockPermissionLevel | undefined {
  return PERMISSION_LEVELS.find((level) => level.id === levelId);
}
