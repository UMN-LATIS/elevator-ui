import { describe, it, expect } from "vitest";
import { buildRuleRows } from "./buildRuleRows";
import { GROUP_TYPES, PERM } from "@/types";
import type {
  DrawerGrant,
  DrawerGrantGroup,
  ManageableDrawer,
  PermissionLevel,
} from "@/types";

const drawers: ManageableDrawer[] = [
  { id: 1, title: "Field Notes" },
  { id: 2, title: null },
];

const permissionLevels: PermissionLevel[] = [
  { id: 10, level: PERM.SEARCH, name: "search", label: "Search" },
  { id: 20, level: PERM.ADMIN, name: "admin", label: "Admin" },
];

const ownGroup: DrawerGrantGroup = {
  id: 5,
  label: "Botany Students",
  type: GROUP_TYPES.USER,
  ownedByCurrentUser: true,
  ownerName: "Ada Lovelace",
};

function makeGrant(overrides: Partial<DrawerGrant> = {}): DrawerGrant {
  return {
    id: 100,
    drawerId: 1,
    permissionLevelId: 10,
    group: ownGroup,
    ...overrides,
  };
}

function buildRows(grants: DrawerGrant[]) {
  return buildRuleRows({ grants, drawers, permissionLevels });
}

describe("buildRuleRows", () => {
  it("joins a grant against its drawer and permission level", () => {
    expect(buildRows([makeGrant()])).toEqual([
      {
        id: 100,
        drawerId: 1,
        drawerTitle: "Field Notes",
        groupId: 5,
        groupLabel: "Botany Students",
        isOwnGroup: true,
        ownerName: "Ada Lovelace",
        permissionLevelId: 10,
        permissionLevelNumber: PERM.SEARCH,
        permissionLabel: "Search",
      },
    ]);
  });

  it("falls back to a placeholder title for an untitled drawer", () => {
    const rows = buildRows([makeGrant({ drawerId: 2 })]);
    expect(rows[0].drawerTitle).toBe("Drawer 2");
  });

  it("labels a group by its type when it has no label", () => {
    const unlabeled = { ...ownGroup, label: "", type: GROUP_TYPES.ALL };
    const rows = buildRows([makeGrant({ group: unlabeled })]);
    expect(rows[0].groupLabel).toBe(GROUP_TYPES.ALL);
  });

  it("carries ownership through for another owner's group", () => {
    const othersGroup = {
      ...ownGroup,
      ownedByCurrentUser: false,
      ownerName: "Bo Diddley",
    };
    const rows = buildRows([makeGrant({ group: othersGroup })]);
    expect(rows[0].isOwnGroup).toBe(false);
    expect(rows[0].ownerName).toBe("Bo Diddley");
  });

  it("keeps a revoked rule, which reads as No Permissions", () => {
    const noPermissions: PermissionLevel = {
      id: 1,
      level: PERM.NOPERM,
      name: "noperm",
      label: "No Permissions",
    };
    const rows = buildRuleRows({
      grants: [makeGrant({ permissionLevelId: 1 })],
      drawers,
      permissionLevels: [...permissionLevels, noPermissions],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].permissionLabel).toBe("No Permissions");
    expect(rows[0].permissionLevelNumber).toBe(PERM.NOPERM);
  });

  it("drops grants that cannot be resolved to a row", () => {
    const unresolvable: DrawerGrant[] = [
      makeGrant({ id: 1, group: null }),
      makeGrant({ id: 2, drawerId: null }),
      makeGrant({ id: 3, permissionLevelId: null }),
      // a drawer or level the caller never received
      makeGrant({ id: 4, drawerId: 999 }),
      makeGrant({ id: 5, permissionLevelId: 999 }),
    ];
    expect(buildRows(unresolvable)).toEqual([]);
  });
});
