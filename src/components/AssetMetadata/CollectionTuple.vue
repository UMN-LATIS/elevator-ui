<template>
  <Tuple v-if="collectionPath?.length" :label="label">
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
import { toCollectionAncestry } from "@/helpers/collectionHelpers";

const props = defineProps<{
  label: string;
  collectionId: AssetCollection["id"];
}>();

const instanceStore = useInstanceStore();

// breadcrumb path like "Collection A / Collection B / Collection C"
const collectionPath = computed((): AssetCollection[] =>
  toCollectionAncestry(instanceStore.collectionIndex, props.collectionId)
);
</script>
<style scoped></style>
