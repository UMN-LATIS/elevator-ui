<template>
  <button
    class="bg-white w-6 h-6 text-neutral-500 inline-flex justify-center items-center rounded-full shadow-sm hover:bg-neutral-900 hover:text-neutral-200 transition-all"
    title="Remove"
    v-bind="$attrs"
    @click="isConfirmModalOpen = true"
  >
    <span class="sr-only">Remove</span>
    &times;
  </button>
  <ConfirmModal
    :isOpen="isConfirmModalOpen"
    :title="`Remove from drawer`"
    type="danger"
    confirmLabel="Remove"
    @close="isConfirmModalOpen = false"
    @confirm="handleRemoveFromDrawer"
  >
    Are you sure you want to remove
    <b>{{ objectTitle ?? "this asset" }}</b> from the drawer
    <b>{{ drawerTitle }}</b
    >?
  </ConfirmModal>
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal.vue";
import { useDrawerStore } from "@/stores/drawerStore";
import { getAssetTitle, stripTags } from "@/helpers/displayUtils";

const props = defineProps<{
  drawerId: number;
  objectId: string;
}>();

const drawerStore = useDrawerStore();
const drawer = computed(() => drawerStore.getDrawerById(props.drawerId));
const object = computed(() =>
  drawer.value?.contents?.matches?.find(
    (match) => match.objectId === props.objectId
  )
);

const isConfirmModalOpen = ref(false);
const objectTitle = computed(() => {
  const rawTitle = object.value?.title;
  if (!rawTitle) return null;
  return Array.isArray(rawTitle) ? stripTags(rawTitle[0]) : stripTags(rawTitle);
});

const drawerTitle = computed(() => {
  return drawer.value?.title;
});

async function handleRemoveFromDrawer() {
  drawerStore.removeAssetFromDrawer({
    drawerId: props.drawerId,
    assetId: props.objectId,
  });
}
</script>
<style scoped></style>
