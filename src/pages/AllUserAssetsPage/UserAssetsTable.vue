<template>
  <div>
    <div class="flex items-center gap-2 mb-3">
      <SearchIcon class="w-4 h-4 text-on-surface-variant" />
      <input
        v-model="globalFilter"
        type="text"
        placeholder="Filter by title or ID..."
        class="flex-1 text-sm bg-transparent border-b border-outline-variant px-1 py-1.5 focus:outline-none focus:border-on-surface placeholder:text-on-surface-variant/60" />
    </div>
    <div class="border border-outline-variant rounded-md">
      <Table>
        <TableHeader class="bg-surface-container-lowest">
          <TableRow
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id">
            <TableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              :class="header.column.getCanSort() ? 'cursor-pointer select-none' : ''"
              @click="header.column.getToggleSortingHandler()?.($event)">
              <div class="flex items-center gap-1">
                <FlexRender
                  v-if="!header.isPlaceholder"
                  :render="header.column.columnDef.header"
                  :props="header.getContext()" />
                <ArrowUpDown
                  v-if="header.column.getCanSort() && !header.column.getIsSorted()"
                  class="w-3.5 h-3.5 opacity-30" />
                <ArrowUp
                  v-else-if="header.column.getIsSorted() === 'asc'"
                  class="w-3.5 h-3.5" />
                <ArrowDown
                  v-else-if="header.column.getIsSorted() === 'desc'"
                  class="w-3.5 h-3.5" />
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TransitionGroup name="table-row">
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :data-state="row.getIsSelected() ? 'selected' : undefined">
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                <FlexRender
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()" />
              </TableCell>
            </TableRow>
          </TransitionGroup>
          <TableRow v-if="!table.getRowModel().rows?.length">
            <TableCell :colspan="columns.length" class="h-24 text-center">
              No results.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
<script setup lang="ts" generic="TData">
import { ref } from "vue";
import type { ColumnDef, SortingState } from "@tanstack/vue-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  FlexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useVueTable,
} from "@tanstack/vue-table";
import { SearchIcon, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-vue-next";

const props = defineProps<{
  columns: ColumnDef<TData, any>[];
  data: TData[];
}>();

const sorting = ref<SortingState>([]);
const globalFilter = ref("");

const table = useVueTable({
  get data() {
    return props.data;
  },
  get columns() {
    return props.columns;
  },
  state: {
    get sorting() {
      return sorting.value;
    },
    get globalFilter() {
      return globalFilter.value;
    },
  },
  onSortingChange: (updater) => {
    sorting.value =
      typeof updater === "function" ? updater(sorting.value) : updater;
  },
  onGlobalFilterChange: (updater) => {
    globalFilter.value =
      typeof updater === "function" ? updater(globalFilter.value) : updater;
  },
  getRowId: (row) => (row as Record<string, unknown>).objectId as string,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
});
</script>
<style scoped>
.table-row-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.table-row-leave-to {
  opacity: 0;
  transform: translateX(-1rem);
}
.table-row-move {
  transition: transform 0.3s ease;
}
</style>
