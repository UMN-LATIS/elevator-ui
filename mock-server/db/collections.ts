import { AssetCollection, RawAssetCollection } from "../../src/types";
import { createBaseTable } from "./baseTable";

const collectionSeeds: AssetCollection[] = [
  {
    id: 1,
    title: "Default Collection",
    previewImageId: "",
    children: [],
    parentId: null,
    showInBrowse: true,
    canView: true,
    canEdit: true,
  },
  {
    id: 2,
    title: "Second Collection",
    previewImageId: "",
    children: [],
    parentId: null,
    showInBrowse: true,
    canView: true,
    canEdit: false,
  },
];

function toRawAssetCollection(collection: AssetCollection): RawAssetCollection {
  return {
    id: collection.id,
    title: collection.title,
    previewImageId: collection.previewImageId,
    showInBrowse: collection.showInBrowse,
    canView: collection.canView,
    canEdit: collection.canEdit,
    children:
      collection.children?.map(toRawAssetCollection) ??
      ([] as RawAssetCollection[]),
  };
}

export function createCollectionsTable() {
  const baseTable = createBaseTable(
    (collection: AssetCollection) => collection.id,
    collectionSeeds
  );

  return {
    ...baseTable,
    getAllAsRawAssetCollections: (): RawAssetCollection[] => {
      return baseTable.getAll().map(toRawAssetCollection);
    },
  };
}

export type CollectionsTable = ReturnType<typeof createCollectionsTable>;
