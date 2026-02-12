<template>
  <button
    class="bg-surface w-6 h-6 text-on-surface-variant inline-flex justify-center items-center rounded-full shadow-sm border border-outline hover:bg-on-surface hover:text-surface transition-all remove-from-drawer-button"
    title="Remove"
    v-bind="$attrs"
    @click="isConfirmModalOpen = true">
    <span class="sr-only">Remove</span>
    &times;
  </button>
  <ConfirmModal
    :isOpen="isConfirmModalOpen"
    :title="`Remove from drawer`"
    type="danger"
    confirmLabel="Remove"
    @close="isConfirmModalOpen = false"
    @confirm="handleRemoveFromDrawer">
    Are you sure you want to remove
    <b>
      {{
        excerptId ? excerptTitle ?? "this excerpt" : objectTitle ?? "this asset"
      }}
    </b>
    from the drawer
    <b>{{ drawerTitle }}</b>
    ?
  </ConfirmModal>
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal.vue";
import { useDrawerStore } from "@/stores/drawerStore";
import { convertHtmlToText } from "@/helpers/displayUtils";

const props = defineProps<{
  drawerId: number;
  objectId: string;
  excerptId?: number;
}>();

const drawerStore = useDrawerStore();
const drawer = computed(() => drawerStore.getDrawerById(props.drawerId));
const object = computed(() =>
  drawer.value?.contents?.matches?.find(
    (match) => match.objectId === props.objectId
  )
);

const excerpt = computed(() =>
  drawer.value?.contents?.matches?.find(
    (match) => match.excerptId === props.excerptId
  )
);

const isConfirmModalOpen = ref(false);
const objectTitle = computed(() => {
  const rawTitle = object.value?.title;
  if (!rawTitle) return null;
  return Array.isArray(rawTitle)
    ? convertHtmlToText(rawTitle[0])
    : convertHtmlToText(rawTitle);
});

const excerptTitle = computed(() => excerpt.value?.excerptLabel ?? null);

const drawerTitle = computed(() => {
  return drawer.value?.title;
});

async function handleRemoveFromDrawer() {
  if (props.excerptId) {
    return drawerStore.removeExcerptFromDrawer({
      drawerId: props.drawerId,
      excerptId: props.excerptId,
    });
  }

  drawerStore.removeAssetFromDrawer({
    drawerId: props.drawerId,
    assetId: props.objectId,
  });
}
</script>
<style scoped></style>
