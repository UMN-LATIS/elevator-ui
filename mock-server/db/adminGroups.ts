import { MockAdminGroup } from "../types";
import { PermissionsGroupEntry } from "../../src/types";
import { createBaseTable } from "./baseTable";

const adminGroupSeeds: MockAdminGroup[] = [
  {
    id: 101,
    type: "User",
    label: "Instance Reviewers",
    // curator's user id
    entries: [{ id: 8001, value: "3" }],
  },
  {
    id: 102,
    type: "Unit",
    label: "College of Design",
    entries: [{ id: 8002, value: "DSGN" }],
  },
  // holds no grant, so the page's Unassigned Groups section has content
  {
    id: 103,
    type: "User",
    label: "Guest Critics",
    entries: [],
  },
];

export function createAdminGroupsTable() {
  const baseTable = createBaseTable(
    (group: MockAdminGroup) => group.id,
    adminGroupSeeds
  );
  let nextGroupId = 110;
  let nextEntryId = 8100;

  return {
    ...baseTable,
    create: (data: Pick<MockAdminGroup, "type" | "label">): MockAdminGroup => {
      const group: MockAdminGroup = { id: nextGroupId++, entries: [], ...data };
      baseTable.set(group.id, group);
      return group;
    },
    addEntry: (group: MockAdminGroup, value: string): PermissionsGroupEntry => {
      const entry: PermissionsGroupEntry = { id: nextEntryId++, value };
      group.entries.push(entry);
      return entry;
    },
    removeEntry: (group: MockAdminGroup, entryId: number): void => {
      group.entries = group.entries.filter((entry) => entry.id !== entryId);
    },
    // Tests mutate a group's entries in place, so seed clones to keep the
    // seed objects pristine for the next refresh.
    seed: (): void => {
      adminGroupSeeds.forEach((group) => {
        baseTable.set(group.id, structuredClone(group));
      });
    },
    reset: (): void => {
      baseTable.reset();
      nextGroupId = 110;
      nextEntryId = 8100;
    },
  };
}

export type AdminGroupsTable = ReturnType<typeof createAdminGroupsTable>;
