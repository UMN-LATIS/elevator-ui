<template>
  <div
    ref="emptyListRef"
    class="empty-list"
    :class="{
      'empty-list--is-dragging-over': isDraggingOver,
    }">
    No items
  </div>
</template>
<script setup lang="ts">
import { inject, onMounted, onUnmounted, ref, computed } from "vue";
import type { CleanupFn } from "@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types";
import * as dnd from "./utils/dnd";
import { useDragDropStore } from "./useDragDropStore";
import { GROUP_ID_PROVIDE_KEY } from "./constants";
import invariant from "tiny-invariant";
import { isDragData, makeDropData } from "./utils/dataHelpers";

const props = defineProps<{
  listId: string | number;
}>();

const groupId = inject(GROUP_ID_PROVIDE_KEY);
invariant(groupId, "groupId must be provided");

const emptyListRef = ref<HTMLElement | null>(null);
const isDraggingOver = ref(false);

const cleanupFns = [] as CleanupFn[];
onUnmounted(dnd.combine(...cleanupFns));

const dragDropStore = useDragDropStore(groupId);

const targetData = computed(() => {
  return makeDropData({
    listId: props.listId,
    targetId: -1,
    groupId,
    targetIndex: 0,
  });
});

function setupDropZone() {
  invariant(emptyListRef.value, "emptyListRef is not defined");

  return dnd.dropTargetForElements({
    element: emptyListRef.value,
    canDrop: ({ source }) => {
      return isDragData(source.data) && source.data.groupId === groupId;
    },
    getData({ element, input }) {
      invariant(groupId, "groupId is not defined");

      // this will 'attach' the closest edge (top, bottom) of
      // target to the `data` object. This is useful for deciding
      // whether to show the drop indicator above or below the target
      const dataWithEdge = dnd.attachClosestEdge(targetData.value, {
        input,
        element,
        allowedEdges: ["top", "bottom"],
      });

      return dataWithEdge;
    },
    onDragEnter() {
      invariant(groupId, "groupId is not defined");
      isDraggingOver.value = true;
      dragDropStore.setTargetData(targetData.value);
    },
    onDragLeave() {
      dragDropStore.setTargetData(null);
      isDraggingOver.value = false;
    },
    onDrop() {
      dragDropStore.setTargetData(null);
      isDraggingOver.value = false;
    },
  });
}

onMounted(() => {
  setupDropZone();
});
</script>
<style scoped>
.empty-list {
  padding: 1rem;
  background: var(--dnd-emptyList-bg);
  border: var(--dnd-emptyList-border);
  color: var(--dnd-emptyList-text);
  text-align: center;
  font-size: 0.75rem;
  font-style: italic;
  cursor: pointer;
}
.empty-list.empty-list--is-dragging-over {
  border: var(--dnd-emptyList-border-draggingOver);
  background: var(--dnd-emptyList-bg-draggingOver);
  color: var(--dnd-emptyList-text-draggingOver);
}
</style>
