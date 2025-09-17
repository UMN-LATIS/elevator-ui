import { omit } from "ramda";
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

/**
 * list of collections with titles that include their parent titles
 */
export function flattenCollections(
  collections: AssetCollection[]
): Omit<AssetCollection, "children">[] {
  const collectionsWithoutChildren = collections.map((collection) =>
    omit(["children"], collection)
  );

  return [
    ...collectionsWithoutChildren,
    ...collections.flatMap((collection) => {
      const children = collection.children ?? [];

      // for each child, prepend the parent title to the child title
      const childrenWithParentTitle = children.map((child) => ({
        ...child,
        title: `${collection.title} › ${child.title}`,
      }));

      return flattenCollections(childrenWithParentTitle);
    }),
  ];
}

/**
 * Recursively filter collection by predicate.
 * If predicate fails, its children will not be included.
 * This is useful for filtering collections based on permissions.
 */
export const filterCollections = (
  predicate: (col: AssetCollection) => boolean,
  nestedCollections: AssetCollection[]
): AssetCollection[] =>
  nestedCollections.filter(predicate).map((col) => ({
    ...col,
    children: col.children?.length
      ? filterCollections(predicate, col.children)
      : col.children,
  }));
