<template>
  <DefaultLayout>
    <div class="p-8 px-4">
      <h1 class="text-4xl font-bold my-8">Drawers</h1>
      <div ref="gridContainer" class="grid grid-cols-2 gap-2">
        <Link
          v-for="drawer in drawers"
          :key="drawer.id"
          :to="`/drawers/viewDrawer/${drawer.id}`"
          class="bg-white rounded-lg p-4"
        >
          {{ drawer.title }}
        </Link>
      </div>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { Drawer } from "@/types";
import api from "@/api";
import Link from "@/components/Link/Link.vue";
import { useResizeObserver } from "@vueuse/core";

const gridContainer = ref<HTMLElement | null>(null);
const drawers = ref<Drawer[]>([]);
const numCols = ref(1);

// by default, css grid will order the items by left-to-right,
// then top-to-bottom. This makes is difficult to read:
// we want to show grid columns ordered top-to-bottom,
// then left-to-right so that it reads alphabetically.
// once we know the number of rows and columns, we can
// use css grid and set grid-auto-flow to column
// to achieve this.
useResizeObserver(gridContainer, (entries) => {
  const [entry] = entries;
  const { width } = entry.contentRect;
  if (width < 640) numCols.value = 1;
  if (width < 768) numCols.value = 2;
  if (width < 1024) numCols.value = 3;
  if (width >= 1024) numCols.value = 4;
});

const numRows = computed(() => {
  return Math.ceil(drawers.value.length / numCols.value);
});

onMounted(async () => {
  drawers.value = await api.getDrawers();
});
</script>
<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(v-bind("numCols"), 1fr);
  grid-template-rows: repeat(v-bind("numRows"), auto);
  grid-auto-flow: column;
  gap: 0.5rem;
}
</style>
