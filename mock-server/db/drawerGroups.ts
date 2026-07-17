import { MockDrawerGroup, MockGroupEntry } from "../types";
import { createBaseTable } from "./baseTable";

const drawerGroupSeeds: MockDrawerGroup[] = [
  {
    id: 201,
    userId: 1,
    type: "User",
    label: "Art History Students",
    entries: [{ id: 9001, value: "2" }],
  },
  {
    id: 202,
    userId: 1,
    type: "Unit",
    label: "Library Staff",
    entries: [{ id: 9002, value: "LIBR" }],
  },
];

export function createDrawerGroupsTable() {
  const baseTable = createBaseTable(
    (group: MockDrawerGroup) => group.id,
    drawerGroupSeeds
  );
  let nextGroupId = 210;
  let nextEntryId = 9100;

  return {
    ...baseTable,
    getByUserId: (userId: number): MockDrawerGroup[] => {
      return baseTable.filter((group) => group.userId === userId);
    },
    create: (
      data: Pick<MockDrawerGroup, "userId" | "type" | "label">
    ): MockDrawerGroup => {
      const group: MockDrawerGroup = {
        id: nextGroupId++,
        entries: [],
        ...data,
      };
      baseTable.set(group.id, group);
      return group;
    },
    addEntry: (group: MockDrawerGroup, value: string): MockGroupEntry => {
      const entry: MockGroupEntry = { id: nextEntryId++, value };
      group.entries.push(entry);
      return entry;
    },
    removeEntry: (group: MockDrawerGroup, entryId: number): void => {
      group.entries = group.entries.filter((entry) => entry.id !== entryId);
    },
    // Tests mutate a group's entries in place, so seed clones to keep the
    // seed objects pristine for the next refresh.
    seed: (): void => {
      drawerGroupSeeds.forEach((group) => {
        baseTable.set(group.id, structuredClone(group));
      });
    },
    reset: (): void => {
      baseTable.reset();
      nextGroupId = 210;
      nextEntryId = 9100;
    },
  };
}

export type DrawerGroupsTable = ReturnType<typeof createDrawerGroupsTable>;
