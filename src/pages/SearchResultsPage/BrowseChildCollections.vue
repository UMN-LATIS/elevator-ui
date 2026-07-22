<template>
  <section v-if="isPanelEnabled && browsableChildren.length" class="my-8">
    <h2 class="text-xl font-bold mb-4">Sub-Collections</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      <CollectionItem
        v-for="child in browsableChildren"
        :key="child.id"
        :collection="child" />
    </div>
  </section>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useInstanceStore } from "@/stores/instanceStore";
import { filterCollections } from "@/helpers/collectionHelpers";
import { AssetCollection } from "@/types";
import CollectionItem from "@/components/CollectionItem/CollectionItem.vue";

const props = defineProps<{
  collectionId: number;
}>();

const instanceStore = useInstanceStore();

// Instance admins can turn the browse panel off for the whole instance.
const isPanelEnabled = computed(
  () => instanceStore.instance.showChildCollections
);

// Same predicate the All Collections page uses for its top level, so the
// panel and the full page agree on which children are shown.
const browsableChildren = computed((): AssetCollection[] => {
  const collection = instanceStore.collectionIndex[props.collectionId];
  return filterCollections(
    (col) => col.canView && col.showInBrowse,
    collection?.children ?? []
  );
});
</script>
