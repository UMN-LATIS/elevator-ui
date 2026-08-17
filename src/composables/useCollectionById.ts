import { computed, MaybeRefOrGetter, toValue } from "vue";
import { useCollectionDescriptionQuery } from "@/queries/useCollectionDescriptionQuery";
import { useCollections } from "./useCollections";
import { AssetCollection } from "@/types";

export function useCollectionById(idRef: MaybeRefOrGetter<number | null>) {
  const { collectionIndex } = useCollections();
  const { data: collectionDescription } = useCollectionDescriptionQuery(idRef);

  return {
    collection: computed((): AssetCollection | null => {
      const id = toValue(idRef);
      if (!id) return null;

      const collection = collectionIndex.value[id] ?? null;
      if (!collection) return null;

      return {
        ...collection,
        description: collectionDescription.value ?? "",
      };
    }),
  };
}
