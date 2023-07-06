<template>
  <header class="my-8">
    <Link :to="`/drawers/listDrawers`" class="flex items-center gap-1 mb-4">
      <ArrowForwardIcon class="transform rotate-180 h-4 w-4" />
      Back to Drawers
    </Link>
    <h2 class="text-4xl font-bold">{{ drawerTitle }}</h2>
  </header>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useDrawerStore } from "@/stores/drawerStore";

const props = defineProps<{
  drawerId?: number;
}>();

const drawerStore = useDrawerStore();
const drawerTitle = computed(() => {
  const drawer = drawerStore.drawers.find((d) => d.id === props.drawerId);
  return drawer?.title ?? "Drawer";
});
</script>
<style scoped></style>
