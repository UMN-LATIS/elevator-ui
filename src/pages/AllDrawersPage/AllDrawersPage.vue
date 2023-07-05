<template>
  <DefaultLayout>
    <div class="p-8 px-4">
      <h1 class="text-4xl font-bold my-8">Drawers</h1>
      <nav v-if="currentUser?.canManageDrawers" class="mb-4">
        <CreateDrawerButton />
      </nav>
      <div ref="gridContainer" class="grid grid-cols-2 gap-2">
        <TransitionGroup name="fade">
          <article
            v-for="drawer in drawers"
            :key="drawer.id"
            class="relative drawer-list-item rounded hover:bg-white group transition-colors duration-150"
          >
            <DeleteDrawerButton
              v-if="currentUser?.canManageDrawers"
              :drawer="drawer"
              class="float-right"
            />
            <Link
              class="p-4 block hover:no-underline w-full h-full"
              :to="`/drawers/viewDrawer/${drawer.id}`"
            >
              <h2 class="transition-colors duration-150">
                {{ drawer.title }}
              </h2>
            </Link>
          </article>
        </TransitionGroup>
      </div>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import Link from "@/components/Link/Link.vue";
import { useResizeObserver } from "@vueuse/core";
import DeleteDrawerButton from "./DeleteDrawerButton.vue";
import CreateDrawerButton from "./CreateDrawerButton.vue";
import { useDrawerStore } from "@/stores/drawerStore";
import { useInstanceStore } from "@/stores/instanceStore";

const gridContainer = ref<HTMLElement | null>(null);
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
  border: var(--app-accordion-outer-borderWidth) solid
    var(--app-accordion-outer-borderColor);
  background: var(--app-accordion-header-backgroundColor);
  color: var(--app-accordion-header-textColor);
}
</style>
