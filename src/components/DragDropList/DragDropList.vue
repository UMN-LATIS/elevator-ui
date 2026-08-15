<template>
  <div class="drag-drop-list">
    <slot name="header" />
    <slot v-if="!items.length && showEmptyList" name="empty">
      <EmptyList :listId="listId" />
    </slot>
    <ol v-else :class="listClass">
      <DragDropListItem
        v-for="(item, index) in items"
        :key="getItemId(item)"
        :itemId="getItemId(item)"
        :listId="listId"
        :nextListId="nextListId"
        :prevListId="prevListId"
        :index="index"
        :handleClass="handleClass"
        :class="listItemClass">
        <slot name="item" :item="item" />
      </DragDropListItem>
    </ol>
    <slot name="footer" />
  </div>
</template>
<script setup lang="ts" generic="ItemType">
import type { CSSClass, HasId } from "./dndTypes";
import DragDropListItem from "./DragDropListItem.vue";
import { useDragDropStore } from "./useDragDropStore";
import { watch, inject, computed, onUnmounted } from "vue";
import { GROUP_ID_PROVIDE_KEY } from "./constants";
import EmptyList from "./EmptyList.vue";

const props = withDefaults(
  defineProps<{
    listId: string | number;
    nextListId?: string;
    prevListId?: string;
    modelValue: ItemType[];
    handleClass?: CSSClass;
    listClass?: CSSClass;
    listItemClass?: CSSClass;
    showEmptyList?: boolean;
    /** names each item's stable identity. Defaults to reading `item.id`. */
    getItemId?: (item: ItemType) => string | number;
  }>(),
  {
    // the historical contract: items carry an `id`. Reordering silently
    // keyed on undefined would remount every row on each drag, so an item
    // without one is a caller error, not something to paper over
    getItemId: (item: ItemType) => {
      const id = (item as Partial<HasId> | null)?.id;
      if (typeof id !== "string" && typeof id !== "number") {
        throw new Error(
          `DragDropList: item has no usable \`id\` (got ${typeof id}). Give items an \`id\`, or pass getItemId to name their identity.`
        );
      }
      return id;
    },
    showEmptyList: true,
    listClass: () => "drag-drop-list",
    listItemClass: () => "drag-drop-list-item",
    handleClass: () => "drag-drop-list-item-handle",
    listId: () => "",
    nextListId: () => "",
    prevListId: () => "",
  }
);

// if no groupId is provided, generate a random one
// so that there's no movement between different lists
const groupId = inject<string>(GROUP_ID_PROVIDE_KEY) ?? crypto.randomUUID();

const emit = defineEmits<{
  (eventName: "update:modelValue", payload: ItemType[]): void;
}>();

const dragDropStore = useDragDropStore(groupId);

const items = computed(
  () => (dragDropStore.getList(props.listId)?.items ?? []) as ItemType[]
);

// watch for changes in the listId or modelValue and update the store
watch(
  [() => props.listId, () => props.modelValue],
  ([listId, items]) => {
    dragDropStore.setList(listId, items);
  },
  { immediate: true }
);

// The prop sync stores the prop's own array, so a reference match means
// this change came from outside and echoing it back would double every
// edit.
watch(items, (newItems) => {
  if (newItems === props.modelValue) return;
  emit("update:modelValue", newItems);
});

onUnmounted(() => {
  dragDropStore.removeList(props.listId);
});
</script>
<style scoped>
.drag-drop-list {
  border: var(--dnd-list-border);
}
.drag-drop-list ol {
  padding: 0;
  margin: 0;
  list-style-type: none;
}
</style>
