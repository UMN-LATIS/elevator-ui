<template>
  <div
    class="drop-indicator"
    :class="{
      'drop-indicator--top': closestEdgeOfTarget === 'top',
      'drop-indicator--bottom': closestEdgeOfTarget === 'bottom',
    }" />
</template>
<script setup lang="ts">
import { type Edge } from "./utils/dnd";
defineProps<{
  closestEdgeOfTarget: Edge;
}>();
</script>
<style scoped>
.drop-indicator {
  position: absolute;
  width: 100%;
  left: 0;
  z-index: 10;
  height: var(--dnd-indicator-strokeWidth);
  background: var(--dnd-indicator-color);
}

/* Below one item and above the next are the same insertion point, so center
   the line on the border those two items share. Either way the drop lands in
   the same gap, and the line does not jump as the pointer crosses over. */
.drop-indicator--top {
  top: calc(var(--dnd-listItem-borderWidth) / -2);
  transform: translateY(-50%);
}

.drop-indicator--bottom {
  bottom: calc(var(--dnd-listItem-borderWidth) / -2);
  transform: translateY(50%);
}

.drop-indicator::before,
.drop-indicator::after {
  content: "";
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: var(--dnd-indicator-terminalSize);
  height: var(--dnd-indicator-terminalSize);
  border-radius: 50%;
  border: var(--dnd-indicator-strokeWidth) solid var(--dnd-indicator-color);
  --dnd-terminal-position: calc(
    -1 * calc(var(--dnd-indicator-terminalSize) +
          var(--dnd-indicator-strokeWidth) * 2)
  );
}

.drop-indicator::before {
  left: var(--dnd-terminal-position);
}

.drop-indicator::after {
  right: var(--dnd-terminal-position);
}
</style>
