import { RawAssetCollection } from "../../src/types";
import { MockCollection } from "../types";
import { createBaseTable } from "./baseTable";

type CollectionSeed = Pick<
  MockCollection,
  "id" | "title" | "parentId" | "showInBrowse" | "canView" | "canEdit"
> &
  Partial<MockCollection>;

function makeCollectionSeed(seed: CollectionSeed): MockCollection {
  return {
    previewImageId: "",
    description: "",
    // null S3 settings mean the collection uses the instance defaults
    bucket: null,
    bucketRegion: null,
    s3Key: null,
    s3Secret: null,
    ...seed,
  };
}

const collectionSeeds: MockCollection[] = [
  makeCollectionSeed({
    id: 1,
    title: "Default Collection",
    description: "<p>Everything that has no home of its own.</p>",
    parentId: null,
    showInBrowse: true,
    canView: true,
    canEdit: true,
  }),
  makeCollectionSeed({
    id: 2,
    title: "Second Collection",
    parentId: null,
    showInBrowse: true,
    canView: true,
    canEdit: false,
  }),
  makeCollectionSeed({
    id: 3,
    title: "Parent Collection",
    parentId: null,
    showInBrowse: true,
    canView: true,
    canEdit: true,
  }),
  makeCollectionSeed({
    id: 30,
    title: "Child Collection 1",
    parentId: 3,
    showInBrowse: true,
    canView: true,
    canEdit: true,
  }),
  makeCollectionSeed({
    id: 300,
    title: "Grandchild Collection",
    parentId: 30,
    showInBrowse: true,
    canView: true,
    canEdit: true,
  }),
  makeCollectionSeed({
    id: 31,
    title: "Child Collection 2",
    parentId: 3,
    showInBrowse: true,
    canView: true,
    canEdit: true,
  }),
  makeCollectionSeed({
    id: 310,
    title: "Grandchild Collection 2",
    parentId: 31,
    showInBrowse: true,
    canView: true,
    canEdit: true,
  }),
  makeCollectionSeed({
    id: 32,
    title: "Hidden Child Collection",
    parentId: 3,
    showInBrowse: false,
    canView: true,
    canEdit: false,
  }),
  makeCollectionSeed({
    id: 4,
    title: "Non-Browsable Parent Collection",
    parentId: null,
    showInBrowse: false, // Not browsable itself
    canView: true,
    canEdit: true,
  }),

  // case 1: has a browseable child, no grandchildren
  makeCollectionSeed({
    id: 40,
    title: "Browsable Child Collection",
    parentId: 4,
    showInBrowse: false,
    canView: true,
    canEdit: true,
  }),

  // case 2: browseable child with non-browsable grandchild
  makeCollectionSeed({
    id: 41,
    title: "Browsable Child with Non-Browsable Grandchild",
    parentId: 4,
    showInBrowse: true,
    canView: true,
    canEdit: true,
  }),
  makeCollectionSeed({
    id: 410,
    title: "Non-Browsable Grandchild",
    parentId: 41,
    showInBrowse: false,
    canView: true,
    canEdit: true,
  }),

  // case 3: non-browsable child, with a browseable grandchild
  makeCollectionSeed({
    id: 42,
    title: "Non-Browsable Child Collection",
    parentId: 4,
    showInBrowse: false,
    canView: true,
    canEdit: true,
  }),
  makeCollectionSeed({
    id: 420,
    title: "Browsable Grandchild",
    parentId: 42,
    showInBrowse: true,
    canView: true,
    canEdit: true,
  }),
];

const firstGeneratedId =
  Math.max(...collectionSeeds.map((collection) => collection.id)) + 1;

export function createCollectionsTable() {
  const baseTable = createBaseTable(
    (collection: MockCollection) => collection.id,
    collectionSeeds
  );
  let nextId = firstGeneratedId;

  const getChildren = (parentId: number | null): MockCollection[] =>
    baseTable.filter((collection) => collection.parentId === parentId);

  const getSubtreeIds = (collectionId: number): number[] => {
    const descendantIds = getChildren(collectionId).flatMap((child) =>
      getSubtreeIds(child.id)
    );
    return [collectionId, ...descendantIds];
  };

  const toRawAssetCollection = (
    collection: MockCollection
  ): RawAssetCollection => ({
    id: collection.id,
    title: collection.title,
    previewImageId: collection.previewImageId,
    showInBrowse: collection.showInBrowse,
    canView: collection.canView,
    canEdit: collection.canEdit,
    children: getChildren(collection.id).map(toRawAssetCollection),
  });

  return {
    ...baseTable,
    getChildren,
    getSubtreeIds,
    getAllAsRawAssetCollections: (): RawAssetCollection[] =>
      getChildren(null).map(toRawAssetCollection),
    create: (data: Omit<MockCollection, "id">): MockCollection => {
      const collection: MockCollection = { id: nextId++, ...data };
      baseTable.set(collection.id, collection);
      return collection;
    },
    // replaces the row rather than mutating it, so the seed objects stay
    // clean for the next reset
    update: (
      id: number,
      data: Partial<Omit<MockCollection, "id">>
    ): MockCollection | undefined => {
      const collection = baseTable.get(id);
      if (!collection) return undefined;

      const updated: MockCollection = { ...collection, ...data };
      baseTable.set(id, updated);
      return updated;
    },
    reset: (): void => {
      baseTable.reset();
      nextId = firstGeneratedId;
      baseTable.seed();
    },
  };
}

export type CollectionsTable = ReturnType<typeof createCollectionsTable>;
