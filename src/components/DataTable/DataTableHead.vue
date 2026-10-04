<template>
  <TableHead
    class="text-xs uppercase tracking-wider"
    :class="{ 'text-center': column.align === 'center' }"
    :style="{ width: column.width && columnWidths[column.width] }"
    :aria-sort="ariaSort">
    <button
      v-if="isSortable"
      type="button"
      class="inline-flex items-center gap-2 rounded-sm uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      @click="sort = nextSort(sort, column.id)">
      {{ column.label }}
      <ArrowUpDown v-if="!direction" class="h-4 w-4 text-on-surface-muted" />
      <ArrowUp v-else-if="direction === 'asc'" class="h-4 w-4 text-primary" />
      <ArrowDown v-else class="h-4 w-4 text-primary" />
    </button>
    <span v-else :class="{ 'sr-only': column.isLabelHidden }">
      {{ column.label }}
    </span>
  </TableHead>
</template>

<script setup lang="ts" generic="TRow">
import { computed } from "vue";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-vue-next";
import { TableHead } from "@/components/ui/table";
import { nextSort } from "./tableRows";
import type {
  ColumnWidth,
  DataTableColumn,
  SortDirection,
  TableSort,
} from "@/types";

const columnWidths: Record<ColumnWidth, string> = {
  xs: "2.5rem",
  sm: "6rem",
  md: "8rem",
  lg: "12rem",
};

const props = defineProps<{
  column: DataTableColumn<TRow>;
}>();

const sort = defineModel<TableSort | null>("sort", { default: null });

const isSortable = computed((): boolean => Boolean(props.column.sortValue));

const direction = computed((): SortDirection | null =>
  sort.value?.columnId === props.column.id ? sort.value.direction : null
);

const ariaSort = computed(() => {
  if (!direction.value) return undefined;
  return direction.value === "asc" ? "ascending" : "descending";
});
</script>
