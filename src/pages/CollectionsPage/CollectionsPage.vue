<template>
  <DefaultLayout>
    <div class="collections-page p-8 px-4">
      <h1 class="text-4xl font-bold my-8">Collections</h1>
      <div class="grid">
        <CollectionItem
          v-for="collection in collections"
          :key="collection.id"
          :collection="collection"
        />
      </div>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { computed } from "vue";
import CollectionItem from "./CollectionItem.vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useInstanceStore } from "@/stores/instanceStore";
import { useWindowSize } from "@vueuse/core";

const instanceStore = useInstanceStore();

const collections = computed(() => instanceStore.collections);

// by default, css grid will order the items by left-to-right,
// then top-to-bottom. This makes is difficult to read:
// we want to show grid columns ordered top-to-bottom,
// then left-to-right so that it reads alphabetically.
// once we know the number of rows and columns, we can
// use css grid and set grid-auto-flow to column
// to achieve this.
const { width } = useWindowSize();
const numCols = computed(() => {
  if (width.value < 640) return 1;
  if (width.value < 768) return 2;
  if (width.value < 1024) return 3;
  return 4;
});
const numRows = computed(() => {
  return Math.ceil(collections.value.length / numCols.value);
});
</script>
<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(v-bind("numCols"), 1fr);
  grid-template-rows: repeat(v-bind("numRows"), 1fr);
  grid-auto-flow: column;
  gap: 0.5rem;
}
</style>
