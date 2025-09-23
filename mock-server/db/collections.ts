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
  {
    id: 3,
    title: "Parent Collection",
    previewImageId: "",
    children: [
      {
        id: 4,
        title: "Child Collection 1",
        previewImageId: "",
        children: [
          {
            id: 6,
            title: "Grandchild Collection",
            previewImageId: "",
            children: [],
            parentId: 4,
            showInBrowse: true,
            canView: true,
            canEdit: true,
          },
        ],
        parentId: 3,
        showInBrowse: true,
        canView: true,
        canEdit: true,
      },
      {
        id: 4,
        title: "Child Collection 2",
        previewImageId: "",
        children: [
          {
            id: 6,
            title: "Grandchild Collection 2",
            previewImageId: "",
            children: [],
            parentId: 4,
            showInBrowse: true,
            canView: true,
            canEdit: true,
          },
        ],
        parentId: 3,
        showInBrowse: true,
        canView: true,
        canEdit: true,
      },
      {
        id: 5,
        title: "Hidden Child Collection",
        previewImageId: "",
        children: [],
        parentId: 3,
        showInBrowse: false,
        canView: true,
        canEdit: false,
      },
    ],
    parentId: null,
    showInBrowse: true,
    canView: true,
    canEdit: true,
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
