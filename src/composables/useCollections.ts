import { computed } from "vue";
import { useInstanceNavQuery } from "@/queries/useInstanceNavQuery";
import {
  normalizeAssetCollections,
  filterCollections,
  toCollectionIndex,
  flattenCollections,
} from "@/helpers/collectionHelpers";
import { AssetCollection } from "@/types";

export function useCollections() {
  const { data: instanceNav } = useInstanceNavQuery();

  const collections = computed((): AssetCollection[] =>
    normalizeAssetCollections(instanceNav.value?.collections ?? [])
  );

  const viewableCollections = computed((): AssetCollection[] =>
    filterCollections((collection) => collection.canView, collections.value)
  );

  const browsableCollections = computed((): AssetCollection[] =>
    filterCollections(
      (collection) => collection.showInBrowse,
      viewableCollections.value
    )
  );

  const collectionIndex = computed(() => toCollectionIndex(collections.value));

  const flatCollections = computed(() => flattenCollections(collections.value));

  const flatViewableCollections = computed(() =>
    flattenCollections(viewableCollections.value)
  );

  const flatBrowsableCollections = computed(() =>
    flattenCollections(browsableCollections.value)
  );

  return {
    collections,
    flatCollections,
    viewableCollections,
    flatViewableCollections,
    browsableCollections,
    flatBrowsableCollections,
    collectionIndex,
  };
}
