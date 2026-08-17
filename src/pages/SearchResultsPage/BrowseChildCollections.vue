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
import CollectionItem from "@/components/CollectionItem/CollectionItem.vue";
import { useCollectionById } from "@/composables/useCollectionById";
import { useElevatorInstance } from "@/composables/useElevatorInstance";

const props = defineProps<{
  collectionId: number;
}>();

const { browsableChildren } = useCollectionById(() => props.collectionId);
const { instance } = useElevatorInstance();

// Instance admins can turn the browse panel off for the whole instance.
const isPanelEnabled = computed(
  () => instance.value?.showChildCollections ?? false
);
</script>
