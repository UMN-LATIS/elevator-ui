<template>
  <button
    class="bg-white w-6 h-6 text-neutral-300 inline-flex justify-center items-center rounded-full shadow-sm hover:bg-neutral-900 hover:text-neutral-200 transition-all"
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
import { useToastStore } from "@/stores/toastStore";
import { useDrawerStore } from "@/stores/drawerStore";

const props = defineProps<{
  drawerId: number;
  objectId: string;
}>();

const drawerStore = useDrawerStore();

const isConfirmModalOpen = ref(false);
const objectTitle = computed(() => {
  return "TODO";
});
const drawerTitle = computed(() => {
  return "TODO";
});

async function handleRemoveFromDrawer() {
  drawerStore.removeAssetFromDrawer({
    drawerId: props.drawerId,
    assetId: props.objectId,
  });

  // // cache the object to remove
  // if (!removedObject) throw new Error("No object to remove");

  // // optimistically update
  // results.value = results.value.filter(
  //   (result) => result.objectId !== removedObject.objectId
  // );
  // totalResults.value = totalResults.value - 1;
  // objectIdToRemove.value = null;

  // fetchStatus.value = "fetching";
  // await api.removeAssetFromDrawer({
  //   drawerId: props.drawerId,
  //   assetId: removedObject.objectId,
  // });
  // fetchStatus.value = "success";

  // toastStore.addToast(
  //   `Removed ${removedObject.title} from ${drawerTitle.value} drawer`
  // );
}
</script>
<style scoped></style>
