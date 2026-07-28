import { MockCollectionGrant, MockInstanceGrant } from "../types";
import { createBaseTable } from "./baseTable";

// Instance Reviewers can search and browse the whole instance.
// Guest Critics hold no grant on purpose.
const instanceGrantSeeds: MockInstanceGrant[] = [
  { id: 401, groupId: 101, permissionLevelId: 4 },
];

// College of Design views derivatives on the Default Collection.
const collectionGrantSeeds: MockCollectionGrant[] = [
  { id: 501, collectionId: 1, groupId: 102, permissionLevelId: 5 },
];

export function createInstanceGrantsTable() {
  const baseTable = createBaseTable(
    (grant: MockInstanceGrant) => grant.id,
    instanceGrantSeeds
  );
  let nextGrantId = 410;

  return {
    ...baseTable,
    create: (data: Omit<MockInstanceGrant, "id">): MockInstanceGrant => {
      const grant: MockInstanceGrant = { id: nextGrantId++, ...data };
      baseTable.set(grant.id, grant);
      return grant;
    },
    findByGroupId: (groupId: number): MockInstanceGrant | undefined => {
      return baseTable.find((grant) => grant.groupId === groupId);
    },
    // deleting a group cascades to its grants, like the real schema
    removeByGroupId: (groupId: number): void => {
      baseTable
        .filter((grant) => grant.groupId === groupId)
        .forEach((grant) => baseTable.delete(grant.id));
    },
    seed: (): void => {
      instanceGrantSeeds.forEach((grant) => {
        baseTable.set(grant.id, structuredClone(grant));
      });
    },
    reset: (): void => {
      baseTable.reset();
      nextGrantId = 410;
    },
  };
}

export function createCollectionGrantsTable() {
  const baseTable = createBaseTable(
    (grant: MockCollectionGrant) => grant.id,
    collectionGrantSeeds
  );
  let nextGrantId = 510;

  return {
    ...baseTable,
    create: (data: Omit<MockCollectionGrant, "id">): MockCollectionGrant => {
      const grant: MockCollectionGrant = { id: nextGrantId++, ...data };
      baseTable.set(grant.id, grant);
      return grant;
    },
    findByCollectionAndGroup: (
      collectionId: number,
      groupId: number
    ): MockCollectionGrant | undefined => {
      return baseTable.find(
        (grant) =>
          grant.collectionId === collectionId && grant.groupId === groupId
      );
    },
    // deleting a group cascades to its grants, like the real schema
    removeByGroupId: (groupId: number): void => {
      baseTable
        .filter((grant) => grant.groupId === groupId)
        .forEach((grant) => baseTable.delete(grant.id));
    },
    seed: (): void => {
      collectionGrantSeeds.forEach((grant) => {
        baseTable.set(grant.id, structuredClone(grant));
      });
    },
    reset: (): void => {
      baseTable.reset();
      nextGrantId = 510;
    },
  };
}

export type InstanceGrantsTable = ReturnType<typeof createInstanceGrantsTable>;
export type CollectionGrantsTable = ReturnType<
  typeof createCollectionGrantsTable
>;
