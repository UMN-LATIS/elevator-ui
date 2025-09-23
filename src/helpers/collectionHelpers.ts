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
 * If predicate fails, children will be checked and appended if they pass.
 * This is useful for filtering collections based on permissions.
 */
export const filterCollections = (
  predicate: (col: AssetCollection) => boolean,
  nestedCollections: AssetCollection[]
): AssetCollection[] => {
  const result: AssetCollection[] = [];

  for (const collection of nestedCollections) {
    // recursively filter children by predicate
    const filteredChildren = filterCollections(
      predicate,
      collection.children ?? []
    );

    // if this collection passes the predicate, include it with its filtered children
    if (predicate(collection)) {
      result.push({
        ...collection,
        children: filteredChildren,
      });
    }

    // if this collection fails the predicate, but has children that passed, include those children
    else if (filteredChildren.length) {
      // update the children's parentId to this collection's parentId
      const promotedFilteredChildren = filteredChildren.map((child) => ({
        ...child,
        parentId: collection.parentId,
      }));
      result.push(...promotedFilteredChildren);
    }

    // and if neither the collection nor its children pass,
    // do nothing (i.e., exclude it)
  }

  return result;
};
