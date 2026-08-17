import { computed, MaybeRefOrGetter, toValue } from "vue";
import { useCollectionDescriptionQuery } from "@/queries/useCollectionDescriptionQuery";
import { useCollections } from "./useCollections";
import { AssetCollection } from "@/types";
import {
  filterCollections,
  toCollectionAncestry,
} from "@/helpers/collectionHelpers";
import { filter } from "ramda";

export function useCollectionById(idRef: MaybeRefOrGetter<number | null>) {
  const { collectionIndex } = useCollections();
  const { data: collectionDescription } = useCollectionDescriptionQuery(idRef);

  const collection = computed((): AssetCollection | null => {
    const id = toValue(idRef);
    if (!id) return null;

    const collection = collectionIndex.value[id] ?? null;
    if (!collection) return null;

    return {
      ...collection,
      description: collectionDescription.value ?? "",
    };
  });

  /**
   * Ancestry path from the top-most ancestor down to the
   * given collection, for rendering a breadcrumb trail.
   */
  const collectionAncestry = computed((): AssetCollection[] => {
    const collectionId = toValue(idRef);
    if (!collectionId) return [];
    return toCollectionAncestry(collectionIndex.value, collectionId);
  });

  const viewableChildren = computed((): AssetCollection[] => {
    const collectionId = toValue(idRef);
    if (!collectionId) return [];
    return filterCollections(
      (coll) => coll.canView,
      collection.value?.children ?? []
    );
  });

  const browsableChildren = computed((): AssetCollection[] => {
    const collectionId = toValue(idRef);
    if (!collectionId) return [];
    return filterCollections(
      (coll) => coll.showInBrowse,
      collection.value?.children ?? []
    );
  });

  return {
    collection,
    collectionAncestry,
    viewableChildren,
    browsableChildren,
  };
}
