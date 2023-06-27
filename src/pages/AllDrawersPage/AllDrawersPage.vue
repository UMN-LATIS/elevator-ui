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
            class="bg-white rounded-lg p-4 relative"
          >
            <h2 class="mr-6">
              <Link :to="`/drawers/viewDrawer/${drawer.id}`"
                >{{ drawer.title }}
              </Link>
            </h2>

            <button
              v-if="currentUser?.canManageDrawers"
              class="absolute top-0 right-0 px-2 py-4 flex items-center justify-center text-transparent-black-400 hover:text-neutral-900"
              type="button"
              @click="handleRemoveDrawer(drawer.id)"
            >
              <span class="sr-only">Remove drawer</span>
              <CircleXIcon class="!w-5 !h-5" />
            </button>
          </article>
        </TransitionGroup>
      </div>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import Link from "@/components/Link/Link.vue";
import { useResizeObserver } from "@vueuse/core";
import CircleXIcon from "@/icons/CircleXIcon.vue";
import CreateDrawerButton from "@/components/CreateDrawerButton/CreateDrawerButton.vue";
import { useDrawerStore } from "@/stores/drawerStore";
import { useInstanceStore } from "@/stores/instanceStore";

const gridContainer = ref<HTMLElement | null>(null);
const numCols = ref(1);
const instanceStore = useInstanceStore();
const drawerStore = useDrawerStore();
const currentUser = computed(() => instanceStore.currentUser);
const drawers = computed(() => drawerStore.drawers);

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

function handleRemoveDrawer(drawerId: string) {
  console.log("remove drawer", drawerId);
}

onMounted(async () => {
  drawerStore.init();
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
