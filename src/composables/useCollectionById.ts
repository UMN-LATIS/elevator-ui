import { computed, MaybeRefOrGetter, toValue } from "vue";
import { useCollectionDescriptionQuery } from "@/queries/useCollectionDescriptionQuery";
import { useCollections } from "./useCollections";
import { AssetCollection } from "@/types";
import {
  filterCollections,
  toCollectionAncestry,
} from "@/helpers/collectionHelpers";

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

  // same predicate the All Collections page uses for its top level, so
  // the browse panel and the full page agree on which children are shown
  const browsableChildren = computed((): AssetCollection[] =>
    filterCollections(
      (child) => child.canView && child.showInBrowse,
      collection.value?.children ?? []
    )
  );

  return {
    collection,
    collectionAncestry,
    browsableChildren,
  };
}
