import { AssetCollection, RawAssetCollection } from "@/types";

export function toNormalAssetCollection(
  collection: RawAssetCollection,
  parentId: number | null = null
): AssetCollection {
  return {
    ...collection,
    parentId,
    previewImageId: collection.previewImageId || null,
    children: collection.children
      ? collection.children.map((c) =>
          toNormalAssetCollection(c, collection.id)
        )
      : [],
  };
}

export function normalizeAssetCollections(
  collections: RawAssetCollection[],
  parentId: number | null = null
): AssetCollection[] {
  return collections.map((c) => toNormalAssetCollection(c, parentId));
}

export function toCollectionIndex(collections: AssetCollection[] | null): {
  [id: number]: AssetCollection;
} {
  // no collections? return empty object
  // this is the base case of the recursion
  if (!collections) return {};
  return collections.reduce(
    (acc, coll) => ({
      ...acc,
      [coll.id]: coll,
      ...toCollectionIndex(coll.children),
    }),
    {}
  );
}
