import { AssetCollection } from "@/types";

type CollectionWithoutChildren = Omit<AssetCollection, "children">;

/**
 * Flatten a collection tree into a single array
 */
export const flattenCollections = (
  collections: AssetCollection[]
): CollectionWithoutChildren[] =>
  collections.reduce((acc, coll) => {
    const { children, ...currentCollection } = coll;
    const childCollections = children ? flattenCollections(children) : [];
    return [...acc, currentCollection, ...childCollections];
  }, [] as CollectionWithoutChildren[]);

/**
 * Convert an array of collections into a dictionary
 * keyed by collection id
 */
export const toCollectionDict = (
  collections: AssetCollection[]
): Record<string, CollectionWithoutChildren> => {
  return flattenCollections(collections).reduce((acc, coll) => {
    return { ...acc, [coll.id]: coll };
  }, {});
};
