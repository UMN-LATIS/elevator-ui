import { AssetCollection } from "../../src/types";

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

export const collections = {
  get: (collectionId: AssetCollection["id"]): AssetCollection | undefined => {
    return collectionStore.get(collectionId);
  },
  getAll: (): AssetCollection[] => {
    return Array.from(collectionStore.values());
  },
};
