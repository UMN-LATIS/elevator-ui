<template>
  <Tuple v-if="collectionPath?.length" label="Collection">
    <template
      v-for="(collection, index) in collectionPath"
      :key="collection.id">
      <Link
        :to="`/collections/${collection.id}`"
        :class="{ 'mr-1': index < collectionPath.length - 1 }">
        {{ collection.title }}
      </Link>
      <span v-if="index < collectionPath.length - 1" class="mr-1">/</span>
    </template>
  </Tuple>
</template>
<script setup lang="ts">
import Tuple from "@/components/Tuple/Tuple.vue";
import Link from "@/components/Link/Link.vue";
import { computed } from "vue";
import { useInstanceStore } from "@/stores/instanceStore";
import { AssetCollection } from "@/types";

const props = defineProps<{
  collectionId: AssetCollection["id"];
}>();

const instanceStore = useInstanceStore();

// create a path to the collection
// so we can display it as a breadcrumb
// like "Collection A / Collection B / Collection C"
const collectionPath = computed(() => {
  if (!props.collectionId) return null;

  const collection = instanceStore.collectionIndex[props.collectionId];

  if (!collection) {
    throw new Error(
      `Collection ${props.collectionId} not found in instanceStore`
    );
  }

  // construct a path to this collection
  const path = [collection];
  let child = collection;
  while (child.parentId) {
    child = instanceStore.collectionIndex[child.parentId];
    path.unshift(child);
  }

  return path;
});
</script>
<style scoped></style>
