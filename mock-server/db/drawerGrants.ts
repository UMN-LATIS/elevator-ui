import { MockDrawerGrant } from "../types";
import { createBaseTable } from "./baseTable";

// Art History Students hold View Derivatives (Group 1) on My Drawer.
// Library Staff hold no grant, so its row starts at No Permissions.
// The second grant puts admin's group on the curator's drawer, so the
// curator manages a grant on a group they do not own.
const drawerGrantSeeds: MockDrawerGrant[] = [
  { id: 301, drawerId: 1, groupId: 201, permissionLevelId: 5 },
  { id: 302, drawerId: 2, groupId: 201, permissionLevelId: 5 },
];

export function createDrawerGrantsTable() {
  const baseTable = createBaseTable(
    (grant: MockDrawerGrant) => grant.id,
    drawerGrantSeeds
  );
  let nextGrantId = 310;

  return {
    ...baseTable,
    create: (data: Omit<MockDrawerGrant, "id">): MockDrawerGrant => {
      const grant: MockDrawerGrant = { id: nextGrantId++, ...data };
      baseTable.set(grant.id, grant);
      return grant;
    },
    findByDrawerAndGroup: (
      drawerId: number,
      groupId: number
    ): MockDrawerGrant | undefined => {
      return baseTable.find(
        (grant) => grant.drawerId === drawerId && grant.groupId === groupId
      );
    },
    // deleting a group cascades to its grants, like the real schema
    removeByGroupId: (groupId: number): void => {
      baseTable
        .filter((grant) => grant.groupId === groupId)
        .forEach((grant) => baseTable.delete(grant.id));
    },
    seed: (): void => {
      drawerGrantSeeds.forEach((grant) => {
        baseTable.set(grant.id, structuredClone(grant));
      });
    },
    reset: (): void => {
      baseTable.reset();
      nextGrantId = 310;
    },
  };
}

export type DrawerGrantsTable = ReturnType<typeof createDrawerGrantsTable>;
