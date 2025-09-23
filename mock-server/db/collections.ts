import { AssetCollection, RawAssetCollection } from "../../src/types";
import { createBaseTable } from "./baseTable";

const collectionSeeds: AssetCollection[] = [
  {
    id: 1,
    title: "Default Collection",
    previewImageId: "",
    parentId: null,
    showInBrowse: true,
    canView: true,
    canEdit: true,
    children: [],
  },
  {
    id: 2,
    title: "Second Collection",
    previewImageId: "",
    parentId: null,
    showInBrowse: true,
    canView: true,
    canEdit: false,
    children: [],
  },
  {
    id: 3,
    title: "Parent Collection",
    previewImageId: "",
    parentId: null,
    showInBrowse: true,
    canView: true,
    canEdit: true,
    children: [
      {
        id: 30,
        title: "Child Collection 1",
        previewImageId: "",
        parentId: 3,
        showInBrowse: true,
        canView: true,
        canEdit: true,
        children: [
          {
            id: 300,
            title: "Grandchild Collection",
            previewImageId: "",
            children: [],
            parentId: 30,
            showInBrowse: true,
            canView: true,
            canEdit: true,
          },
        ],
      },
      {
        id: 31,
        title: "Child Collection 2",
        previewImageId: "",
        parentId: 3,
        showInBrowse: true,
        canView: true,
        canEdit: true,
        children: [
          {
            id: 310,
            title: "Grandchild Collection 2",
            previewImageId: "",
            children: [],
            parentId: 31,
            showInBrowse: true,
            canView: true,
            canEdit: true,
          },
        ],
      },
      {
        id: 32,
        title: "Hidden Child Collection",
        previewImageId: "",
        parentId: 3,
        showInBrowse: false,
        canView: true,
        canEdit: false,
        children: [],
      },
    ],
  },
  {
    id: 4,
    title: "Non-Browsable Parent Collection",
    previewImageId: "",
    parentId: null,
    showInBrowse: false, // Not browsable itself
    canView: true,
    canEdit: true,
    children: [
      // case 1: has a browseable child, no grandchildren
      {
        id: 40,
        title: "Browsable Child Collection",
        previewImageId: "",
        parentId: 4,
        showInBrowse: false,
        canView: true,
        canEdit: true,
        children: [],
      },

      // case 2: browseable child with non-browsable grandchild
      {
        id: 41,
        title: "Browsable Child with Non-Browsable Grandchild",
        previewImageId: "",
        parentId: 4,
        showInBrowse: true,
        canView: true,
        canEdit: true,
        children: [
          {
            id: 410,
            title: "Non-Browsable Grandchild",
            previewImageId: "",
            children: [],
            parentId: 41,
            showInBrowse: false,
            canView: true,
            canEdit: true,
          },
        ],
      },
      //case 3: non-browsable child, with a browseable grandchild
      {
        id: 42,
        title: "Non-Browsable Child Collection",
        previewImageId: "",
        parentId: 4,
        showInBrowse: false,
        canView: true,
        canEdit: true,
        children: [
          {
            id: 420,
            title: "Browsable Grandchild",
            previewImageId: "",
            children: [],
            parentId: 42,
            showInBrowse: true,
            canView: true,
            canEdit: true,
          },
        ],
      },
    ],
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
