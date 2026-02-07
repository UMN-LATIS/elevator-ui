<template>
  <DefaultLayout class="all-drawers-page">
    <template #custom-header>
      <CustomAppHeader
        v-if="instanceStore.customHeaderMode === ShowCustomHeaderMode.ALWAYS" />
    </template>
    <div class="p-8 px-4">
      <h1 class="text-4xl font-bold my-8">Drawers</h1>
      <nav v-if="currentUser?.canManageDrawers" class="mb-4">
        <CreateDrawerButton />
      </nav>
      <div ref="gridContainer" class="grid grid-cols-2 gap-2">
        <TransitionGroup name="fade">
          <p v-if="drawerStore.isReady && !drawers.length" key="no-drawers">
            No drawers.
          </p>
          <article
            v-for="drawer in drawers"
            :key="drawer.id"
            class="relative drawer-list-item rounded group transition-colors duration-150">
            <DeleteDrawerButton
              v-if="currentUser?.canManageDrawers"
              :drawer="drawer"
              class="float-right" />
            <Link
              class="p-4 block hover:no-underline w-full h-full"
              :to="`/drawers/viewDrawer/${drawer.id}`">
              <h2 class="transition-colors duration-150">
                {{ drawer.title }}
              </h2>
            </Link>
          </article>
        </TransitionGroup>
      </div>
    </div>
    <template #footer>
      <AppFooter
        v-if="instanceStore.customHeaderMode === ShowCustomHeaderMode.ALWAYS" />
    </template>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { ref, computed, useTemplateRef } from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import CustomAppHeader from "@/components/CustomAppHeader/CustomAppHeader.vue";
import AppFooter from "@/components/AppFooter/AppFooter.vue";
import Link from "@/components/Link/Link.vue";
import { useResizeObserver } from "@vueuse/core";
import DeleteDrawerButton from "./DeleteDrawerButton.vue";
import CreateDrawerButton from "./CreateDrawerButton.vue";
import { useDrawerStore } from "@/stores/drawerStore";
import { useInstanceStore } from "@/stores/instanceStore";
import { ShowCustomHeaderMode } from "@/types";

const gridContainer = useTemplateRef("gridContainer");
const numCols = ref(1);
const instanceStore = useInstanceStore();
const drawerStore = useDrawerStore();
const currentUser = computed(() => instanceStore.currentUser);
const drawers = computed(() =>
  [...drawerStore.drawers].sort((a, b) => {
    return a.title.localeCompare(b.title);
  })
);

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
</script>
<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(v-bind("numCols"), 1fr);
  grid-template-rows: repeat(v-bind("numRows"), auto);
  grid-auto-flow: column;
  gap: 0.5rem;
}

.drawer-list-item {
  background: var(--surface-container);
  color: var(--on-surface);
  border: 1px solid var(--outline-variant);

  & :is(h1, h2, h3, h4, h5, a) {
    color: var(--on-surface);
  }
}

.drawer-list-item:hover {
  background: var(--primary-container);
  color: var(--primary);
  border-color: var(--primary);

  & :is(h1, h2, h3, h4, h5, a) {
    color: var(--primary);
  }
}
</style>
