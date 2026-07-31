<template>
  <button
    ref="buttonRef"
    type="button"
    class="drag-handle"
    @click="focusHandle">
    <DragHandleIcon class="drag-handle__icon" />
    <span class="sr-only">Drag Handle</span>
  </button>
</template>
<script setup lang="ts">
import DragHandleIcon from "./DragHandleIcon.vue";
import { ref } from "vue";

const buttonRef = ref<HTMLButtonElement | null>(null);

// We want users to see the drag handle focused on click, so that they can
// see the focus ring and use arrow keys to move an item. Safari doesn't
// focus a button on click, so this is a workaround.
function focusHandle(): void {
  buttonRef.value?.focus();
}

// need to expose the ref to the parent component
defineExpose({ buttonRef });
</script>
<style scoped>
.drag-handle {
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

.drag-handle:focus,
.drag-handle:active {
  background: var(--dnd-dragHandle-bg-focus);
  box-shadow: var(--dnd-dragHandle-shadow-focus);
  position: relative;
  z-index: 1;
  color: var(--dnd-dragHandle-color-focus);
}

.drag-handle__icon {
  width: 1.5rem;
  height: 1.5rem;
}
</style>
