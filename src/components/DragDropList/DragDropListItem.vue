<template>
  <li
    ref="listItemRef"
    class="drag-drop-list-item"
    :data-simple-dnd-id="
      getDataId({
        groupId,
        listId: props.listId,
        itemId: props.item.id,
      })
    ">
    <DragHandle
      ref="dragHandleRef"
      :class="handleClass"
      @keydown.up.prevent="handleMoveUp"
      @keydown.down.prevent="handleMoveDown"
      @keydown.left.prevent="handleMoveLeft"
      @keydown.right.prevent="handleMoveRight" />
    <div class="drag-drop-list-item__content">
      <slot />
    </div>
    <DropIndicator v-if="closestEdge" :closestEdgeOfTarget="closestEdge" />
  </li>
</template>
<script setup lang="ts" generic="ItemType extends HasId">
import type { CSSClass, HasId } from "./dndTypes";
import DragHandle from "./DragHandle.vue";
import {
  inject,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  useTemplateRef,
} from "vue";
import * as dnd from "./utils/dnd";
import invariant from "tiny-invariant";
import { GROUP_ID_PROVIDE_KEY } from "./constants";
import { makeDragData, isDragData, makeDropData } from "./utils/dataHelpers";
import DropIndicator from "./DropIndicator.vue";
import { useDragDropStore } from "./useDragDropStore";
import { clamp } from "ramda";
import { flashItem } from "./utils/flashItem";
import { getDataId } from "./utils/getDataId";
import { focusItem } from "./utils/focusItem";
import { announceMove } from "./utils/announceMove";

const props = defineProps<{
  item: ItemType;
  index: number;
  listId: string | number;
  nextListId?: string;
  prevListId?: string;
  handleClass?: CSSClass;
}>();

const groupId = inject(GROUP_ID_PROVIDE_KEY);
invariant(groupId, "groupId is not defined");

const listItemRef = useTemplateRef("listItemRef");
const closestEdge = ref<dnd.Edge | null>(null);

const dragDropStore = useDragDropStore(groupId);

// The actual element is needed by the draggable function.
// Because `DragHandle` is a component and not a native
// element, we use `useTemplateRef` here,
// and within the `DragHandle` component, we use `defineExpose`
const dragHandleRef = useTemplateRef<{ buttonRef: HTMLButtonElement }>(
  "dragHandleRef"
);

// cleanup
type CleanupFn = () => void;
const cleanupFns = [] as CleanupFn[];
onUnmounted(dnd.combine(...cleanupFns));

/**
 * Set up the draggable behavior for the list item.
 * @returns {CleanupFn} A function to clean up the draggable behavior.
 */
function setupDraggable() {
  invariant(listItemRef.value, "listItemRef is not defined");
  invariant(dragHandleRef.value, "dragHandleRef is not defined");
  invariant(groupId, "groupId is not defined");

  return dnd.draggable({
    // here we using the drag handle as a draggable component
    // and then generating a drag preview from the list item
    // this is a workaround for a bug where you can't select text
    // in the list item child elements if draggable=true
    element: dragHandleRef.value.buttonRef,
    onGenerateDragPreview({ nativeSetDragImage }) {
      invariant(listItemRef.value, "listItemRef is not defined");
      invariant(nativeSetDragImage, "nativeSetDragImage is not defined");
      nativeSetDragImage(listItemRef.value, 0, 0);
    },
    getInitialData: () => {
      // data returned here will be available on the `source` object
      return makeDragData({
        sourceId: props.item.id,
        sourceIndex: props.index,
        groupId,
        listId: props.listId,
      });
    },
    onDragStart: () => {
      // store the source index for later use
      dragDropStore.setSourceData(
        makeDragData({
          sourceId: props.item.id,
          sourceIndex: props.index,
          groupId,
          listId: props.listId,
        })
      );

      // announce that item has been picked up
      dnd.announce(`Item ${props.item.id} picked up`);
    },
    onDrop: () => {
      // clear the dragged item
      dragDropStore.setSourceData(null);
    },
  });
}

/**
 * Set up the droppable behavior for the list item.
 * @returns {CleanupFn} A function to clean up the droppable behavior.
 */
function setupDroppable() {
  invariant(listItemRef.value, "listItemRef is not defined");

  return dnd.dropTargetForElements({
    element: listItemRef.value,
    canDrop: ({ source }) => {
      return isDragData(source.data) && source.data.groupId === groupId;
    },
    getData({
      element, // the drop target element
      input, // any modifier keys held down
    }) {
      invariant(groupId, "groupId is not defined");

      const data = makeDropData({
        targetId: props.item.id,
        targetIndex: props.index,
        groupId,
        listId: props.listId,
      });

      // this will 'attach' the closest edge (top, bottom) of
      // target to the `data` object. This is useful for deciding
      // whether to show the drop indicator above or below the target
      const dataWithEdge = dnd.attachClosestEdge(data, {
        input,
        element,
        allowedEdges: ["top", "bottom"],
      });

      return dataWithEdge;
    },
    // dragging over target
    onDrag({ self }) {
      invariant(groupId);

      closestEdge.value = dnd.extractClosestEdge(self.data);
    },
    onDragEnter({ source }) {
      invariant(groupId);

      // announce that item is over the target
      dnd.announce(`Item ${source.data.sourceId} over ${props.item.id}`);
      // store the target index for later use
      dragDropStore.setTargetData(
        makeDropData({
          targetId: props.item.id,
          targetIndex: props.index,
          groupId,
          listId: props.listId,
        })
      );
    },
    onDragLeave() {
      // clear the target index
      dragDropStore.setTargetData(null);
      closestEdge.value = null;
    },
    onDrop() {
      // clear the target index
      dragDropStore.setTargetData(null);
      closestEdge.value = null;
    },
  });
}

function handleMoveDown() {
  const thisList = dragDropStore.getList(props.listId);
  invariant(thisList, "List not found");

  const targetIndex = clamp(0, thisList.items.length - 1, props.index + 1);

  moveToIndex(targetIndex);
}

function handleMoveUp() {
  const targetIndex = Math.max(0, props.index - 1);
  moveToIndex(targetIndex);
}

function moveToIndex(targetIndex: number) {
  if (targetIndex === props.index) {
    return;
  }
  invariant(groupId, "groupId is not defined");
  dragDropStore.moveItem(
    {
      groupId: groupId,
      sourceIndex: props.index,
      listId: props.listId,
    },
    {
      groupId: groupId,
      targetIndex,
      listId: props.listId,
    },
    null
  );

  // flash the item to indicate the change
  nextTick(() => {
    invariant(groupId, "groupId is not defined");
    focusItem({
      groupId,
      listId: props.listId,
      itemId: props.item.id,
    });

    flashItem({
      groupId,
      listId: props.listId,
      itemId: props.item.id,
    });

    // announce the move
    announceMove({
      itemId: props.item.id,
      sourceIndex: props.index,
      targetIndex,
      sourceListId: props.listId,
      targetListId: props.listId,
    });
  });
}

function handleMoveLeft() {
  if (!props.prevListId) {
    return;
  }

  moveList(props.prevListId);
}

function handleMoveRight() {
  if (!props.nextListId) {
    return;
  }

  moveList(props.nextListId);
}

function moveList(targetListId: HasId["id"]) {
  invariant(groupId, "groupId is not defined");
  dragDropStore.moveItem(
    {
      groupId: groupId,
      sourceIndex: props.index,
      listId: props.listId,
    },
    {
      groupId: groupId,
      targetIndex: 0,
      listId: targetListId,
    },
    "top"
  );

  nextTick(() => {
    invariant(groupId, "groupId is not defined");
    focusItem({
      groupId,
      listId: targetListId,
      itemId: props.item.id,
    });

    flashItem({
      groupId,
      listId: targetListId,
      itemId: props.item.id,
    });

    // announce the move
    announceMove({
      itemId: props.item.id,
      sourceIndex: props.index,
      targetIndex: 0,
      sourceListId: props.listId,
      targetListId,
    });
  });
}

onMounted(() => {
  const cleanupDraggable = setupDraggable();
  const cleanupDroppable = setupDroppable();

  cleanupFns.push(cleanupDraggable, cleanupDroppable);
});
</script>
<style scoped>
.drag-drop-list-item {
  display: flex;
  position: relative;
  border: var(--dnd-listItem-border);
  border-bottom: none;
}
.drag-drop-list-item:last-child {
  border-bottom: var(--dnd-listItem-border);
}

.drag-drop-list-item__content {
  flex: 1;
}
</style>
