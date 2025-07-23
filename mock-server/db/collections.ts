import { AssetCollection, RawAssetCollection } from "../../src/types";

const collectionSeeds: AssetCollection[] = [
  {
    id: 1,
    title: "Default Collection",
    previewImageId: "",
    children: [],
    parentId: null,
  },
];

const collectionStore = new Map<AssetCollection["id"], AssetCollection>(
  collectionSeeds.map((collection) => [collection.id, collection])
);

function toRawAssetCollection(collection: AssetCollection): RawAssetCollection {
  return {
    id: collection.id,
    title: collection.title,
    previewImageId: collection.previewImageId,
    children:
      collection.children?.map(toRawAssetCollection) ??
      ([] as RawAssetCollection[]),
  };
}

export const collections = {
  get: (collectionId: AssetCollection["id"]): AssetCollection | undefined => {
    return collectionStore.get(collectionId);
  },
  getAll: (): AssetCollection[] => {
    return Array.from(collectionStore.values());
  },
  getAllAsRawAssetCollections: (): RawAssetCollection[] => {
    return collections.getAll().map(toRawAssetCollection);
  },
};
