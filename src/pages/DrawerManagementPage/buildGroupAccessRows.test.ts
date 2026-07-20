import { describe, it, expect } from "vitest";
import { buildGroupAccessRows } from "./buildGroupAccessRows";
import { GROUP_TYPES, PERM } from "@/types";
import type {
  DrawerGrant,
  DrawerGrantGroup,
  GroupTypeDetails,
  PermissionLevel,
  PermissionsGroup,
} from "@/types";

const MANAGED_DRAWER_ID = 1;

const permissionLevels: PermissionLevel[] = [
  { id: 1, level: PERM.NOPERM, name: "noperm", label: "No Permissions" },
  { id: 10, level: PERM.SEARCH, name: "search", label: "Search" },
  { id: 20, level: PERM.ADMIN, name: "admin", label: "Admin" },
];

const groupTypes: GroupTypeDetails[] = [
  {
    type: GROUP_TYPES.USER,
    label: "Users",
    description: "Named users",
    entryHints: [],
    adminOnly: false,
  },
];

const botany: PermissionsGroup = {
  id: 5,
  type: GROUP_TYPES.USER,
  label: "Botany Students",
  entries_count: 3,
};

const seminar: PermissionsGroup = {
  id: 6,
  type: GROUP_TYPES.USER,
  label: "Spring Seminar",
  entries_count: 0,
};

const botanyGrantGroup: DrawerGrantGroup = {
  id: botany.id,
  label: botany.label,
  type: botany.type,
  ownedByCurrentUser: true,
  ownerName: "Ada Lovelace",
  entries_count: 3,
};

function makeGrant(overrides: Partial<DrawerGrant> = {}): DrawerGrant {
  return {
    id: 100,
    drawerId: MANAGED_DRAWER_ID,
    permissionLevelId: 10,
    group: botanyGrantGroup,
    ...overrides,
  };
}

function buildRows(grants: DrawerGrant[], ownGroups: PermissionsGroup[] = []) {
  return buildGroupAccessRows({
    grants,
    ownGroups,
    drawerId: MANAGED_DRAWER_ID,
    permissionLevels,
    groupTypes,
  });
}

describe("buildGroupAccessRows", () => {
  it("joins a rule against its permission level and group type", () => {
    expect(buildRows([makeGrant()])).toEqual([
      {
        id: 5,
        group: botanyGrantGroup,
        groupLabel: "Botany Students",
        typeLabel: "Users",
        permissionLabel: "Search",
        grantId: 100,
        permissionLevelId: 10,
        permissionLevelNumber: PERM.SEARCH,
      },
    ]);
  });

  it("gives a group with no rule a row with no access", () => {
    const [row] = buildRows([], [seminar]);
    expect(row).toEqual({
      id: 6,
      group: {
        id: 6,
        label: "Spring Seminar",
        type: GROUP_TYPES.USER,
        entries_count: 0,
        ownedByCurrentUser: true,
        ownerName: null,
      },
      groupLabel: "Spring Seminar",
      typeLabel: "Users",
      permissionLabel: "No Permissions",
      grantId: null,
      permissionLevelId: null,
      permissionLevelNumber: 0,
    });
  });

  it("gives a group one row, not one per source", () => {
    const rows = buildRows([makeGrant()], [botany, seminar]);
    expect(rows.map((row) => row.id)).toEqual([5, 6]);
    expect(rows[0].grantId).toBe(100);
    expect(rows[1].grantId).toBeNull();
  });

  it("leads with the groups that reach the drawer", () => {
    // Botany sorts after Archives by name, so only access can put it first
    const archives: PermissionsGroup = {
      id: 9,
      type: GROUP_TYPES.USER,
      label: "Archives Staff",
      entries_count: 1,
    };

    const rows = buildRows([makeGrant()], [archives, botany, seminar]);
    expect(rows.map((row) => row.groupLabel)).toEqual([
      "Botany Students",
      "Archives Staff",
      "Spring Seminar",
    ]);
  });

  it("sorts a group holding a level 0 rule among the groups with none", () => {
    const revoked = buildRows([makeGrant({ permissionLevelId: 1 })], [seminar]);
    expect(revoked.map((row) => row.groupLabel)).toEqual([
      "Botany Students",
      "Spring Seminar",
    ]);
    // both read as no access, so name alone decides the order
    expect(revoked.every((row) => row.permissionLevelNumber === 0)).toBe(true);
  });

  it("reads a level 0 rule as no access, keeping the rule that says so", () => {
    const [row] = buildRows([makeGrant({ permissionLevelId: 1 })]);
    expect(row.permissionLabel).toBe("No Permissions");
    expect(row.permissionLevelNumber).toBe(PERM.NOPERM);
    // the rule still exists, which is how it can be levelled back up
    expect(row.grantId).toBe(100);
  });

  it("keeps another owner's group, which has no row of its own", () => {
    const othersGroup: DrawerGrantGroup = {
      id: 9,
      label: "Archives Staff",
      type: GROUP_TYPES.USER,
      ownedByCurrentUser: false,
      ownerName: "Bo Diddley",
      entries_count: 2,
    };
    const [row] = buildRows([makeGrant({ group: othersGroup })], []);
    expect(row.group.ownedByCurrentUser).toBe(false);
    expect(row.group.ownerName).toBe("Bo Diddley");
  });

  it("drops rules on every drawer but the one being managed", () => {
    const rows = buildRows([
      makeGrant({ id: 1 }),
      makeGrant({ id: 2, drawerId: 2 }),
      makeGrant({ id: 3, drawerId: null }),
    ]);
    expect(rows.map((row) => row.grantId)).toEqual([1]);
  });

  it("labels a group by its type when it has no label", () => {
    const unlabeled = { ...botanyGrantGroup, label: "", type: GROUP_TYPES.ALL };
    const [row] = buildRows([makeGrant({ group: unlabeled })]);
    expect(row.groupLabel).toBe(GROUP_TYPES.ALL);
  });

  it("falls back to the raw type when the catalog has no label for it", () => {
    const everyone = { ...botanyGrantGroup, type: GROUP_TYPES.ALL };
    const [row] = buildRows([makeGrant({ group: everyone })]);
    expect(row.typeLabel).toBe(GROUP_TYPES.ALL);
  });

  it("drops rules that cannot be resolved to a row", () => {
    const unresolvable: DrawerGrant[] = [
      makeGrant({ id: 1, group: null }),
      makeGrant({ id: 2, permissionLevelId: null }),
      // a level the caller never received
      makeGrant({ id: 3, permissionLevelId: 999 }),
    ];
    expect(buildRows(unresolvable)).toEqual([]);
  });
});
