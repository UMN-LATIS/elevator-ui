<template>
  <button
    class="all-drawers-page__delete-drawer-button px-2 py-4 inline-flex items-center justify-center text-outline-variant hover:text-on-surface"
    type="button"
    v-bind="$attrs"
    @click="isConfirmOpen = true">
    <span class="sr-only">Delete drawer</span>
    <CircleXIcon class="!w-5 !h-5" />
  </button>
  <ConfirmModal
    :isOpen="isConfirmOpen"
    title="Delete Drawer"
    type="danger"
    confirmLabel="Delete"
    @close="isConfirmOpen = false"
    @confirm="handleDeleteDrawer">
    <p>
      Are you sure you want to delete drawer
      <b>{{ drawer.title }}</b>
      ? This action cannot be undone.
    </p>
  </ConfirmModal>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { useDrawerStore } from "@/stores/drawerStore";
import { CircleXIcon } from "@/icons";
import { Drawer } from "@/types";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal.vue";

const props = defineProps<{
  drawer: Drawer;
}>();

const drawerStore = useDrawerStore();
const isConfirmOpen = ref(false);

async function handleDeleteDrawer() {
  drawerStore.deleteDrawer(props.drawer.id);
}
</script>
<style scoped></style>
