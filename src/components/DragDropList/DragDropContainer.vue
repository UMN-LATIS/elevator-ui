<template>
  <div class="dnd-drag-drop-container">
    <slot></slot>
  </div>
</template>
<script setup lang="ts">
import { provide, onMounted, onUnmounted, nextTick } from "vue";
import { GROUP_ID_PROVIDE_KEY } from "./constants";
import * as dnd from "./utils/dnd";
import invariant from "tiny-invariant";
import { isDragData, isDropData } from "./utils/dataHelpers";
import { useDragDropStore } from "./useDragDropStore";
import { flashItem } from "./utils/flashItem";
import { focusItem } from "./utils/focusItem";
import { announceMove } from "./utils/announceMove";
import { DragData, DropData } from "./dndTypes";

const props = defineProps<{
  groupId: string | number;
}>();

const emit = defineEmits<{
  (
    eventName: "moveItem",
    payload: {
      fromListId: string | number;
      fromIndex: number;
      toListId: string | number;
      toIndex: number;
    }
  ): void;
}>();

provide(GROUP_ID_PROVIDE_KEY, props.groupId);

type CleanupFn = () => void;
const cleanupFns = [] as CleanupFn[];
onUnmounted(dnd.combine(...cleanupFns));

const dragDropStore = useDragDropStore(props.groupId);

function setupDragDropMonitor(): CleanupFn {
  return dnd.monitorForElements({
    onDrop: ({ source, location }) => {
      const target = location.current.dropTargets[0];

      // dropped outside of any drop target
      if (!target) {
        return;
      }

      invariant(isDragData(source.data), "Expected drag data");
      const sourceData = source.data as DragData;

      invariant(isDropData(target.data), "Expected drop data");
      const targetData = target.data as DropData;

      // if the source and target are in different groups, do nothing
      if (sourceData.groupId !== targetData.groupId) {
        return;
      }

      const closestEdge = dnd.extractClosestEdge(targetData);
      dragDropStore.moveItem(
        {
          groupId: sourceData.groupId,
          listId: sourceData.listId,
          sourceIndex: sourceData.sourceIndex,
        },
        {
          groupId: targetData.groupId,
          targetIndex: targetData.targetIndex,
          listId: targetData.listId,
        },
        closestEdge
      );
      emit("moveItem", {
        fromListId: sourceData.listId,
        fromIndex: sourceData.sourceIndex,
        toListId: targetData.listId,
        toIndex: targetData.targetIndex,
      });

      nextTick(() => {
        announceMove({
          itemId: sourceData.sourceId,
          sourceIndex: sourceData.sourceIndex,
          targetIndex: targetData.targetIndex,
          sourceListId: sourceData.listId,
          targetListId: targetData.listId,
        });
        flashItem({
          groupId: sourceData.groupId,
          listId: targetData.listId,
          itemId: sourceData.sourceId,
        });
        focusItem({
          groupId: sourceData.groupId,
          listId: targetData.listId,
          itemId: sourceData.sourceId,
        });
      });
    },
  });
}

onMounted(() => {
  const cleanupMonitor = setupDragDropMonitor();
  cleanupFns.push(cleanupMonitor);
});
</script>
<style scoped></style>
