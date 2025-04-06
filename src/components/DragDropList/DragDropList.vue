<template>
  <div class="drag-drop-list">
    <slot name="header" />
    <slot v-if="!items.length" name="empty">
      <EmptyList :listId="listId" />
    </slot>
    <ol v-else class="">
      <DragDropListItem
        v-for="(item, index) in items"
        :key="item.id"
        :item="item"
        :listId="listId"
        :nextListId="nextListId"
        :prevListId="prevListId"
        :index="index"
        :handleClass="handleClass">
        <slot name="item" :item="item" />
      </DragDropListItem>
    </ol>
    <slot name="footer" />
  </div>
</template>
<script setup lang="ts" generic="ItemType extends HasId">
import type { CSSClass, HasId } from "./dndTypes";
import DragDropListItem from "./DragDropListItem.vue";
import { useDragDropStore } from "./useDragDropStore";
import { watch, inject, computed } from "vue";
import { GROUP_ID_PROVIDE_KEY } from "./constants";
import EmptyList from "./EmptyList.vue";

const props = defineProps<{
  listId: string | number;
  nextListId?: string;
  prevListId?: string;
  modelValue: ItemType[];
  handleClass?: CSSClass;
}>();

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

// watch for changes in the store and emit the new items
watch(items, (newItems) => {
  emit("update:modelValue", newItems);
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
