<script setup lang="ts">
import { LoaderCircleIcon } from "lucide-vue-next";
import TableCell from "./TableCell.vue";
import TableRow from "./TableRow.vue";

defineProps<{
  colspan: number;
}>();
</script>

<template>
  <TableRow>
    <TableCell :colspan="colspan">
      <div
        role="status"
        class="flex items-center justify-center gap-2 py-6 text-sm text-on-surface-variant">
        <LoaderCircleIcon
          class="size-4 shrink-0 animate-spin"
          aria-hidden="true" />
        <slot />
      </div>
    </TableCell>
  </TableRow>
</template>
