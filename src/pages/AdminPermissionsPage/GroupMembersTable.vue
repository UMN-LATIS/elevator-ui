<template>
  <div class="border border-outline-variant rounded-md">
    <Table class="w-full">
      <TableHeader>
        <TableRow
          v-for="headerGroup in table.getHeaderGroups()"
          :key="headerGroup.id">
          <TableHead
            v-for="header in headerGroup.headers"
            :key="header.id"
            :class="[
              'border-b border-outline-variant',
              {
                'cursor-pointer select-none': header.column.getCanSort(),
              },
            ]"
            @click="header.column.getToggleSortingHandler()?.($event)">
            <div class="flex items-center gap-2">
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()" />
              <template v-if="header.column.getCanSort()">
                <ArrowUpDown
                  v-if="!header.column.getIsSorted()"
                  class="h-4 w-4 text-on-surface-muted" />
                <ArrowUp
                  v-else-if="header.column.getIsSorted() === 'asc'"
                  class="h-4 w-4 text-primary" />
                <ArrowDown v-else class="h-4 w-4 text-primary" />
              </template>
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <template v-if="isLoading">
          <TableRow v-for="row in SKELETON_ROW_COUNT" :key="`skeleton-${row}`">
            <TableCell v-for="(_, index) in columns" :key="index">
              <Skeleton height="1rem" width="70%" />
            </TableCell>
          </TableRow>
        </template>
        <template v-else>
          <TableRow v-for="row in table.getRowModel().rows" :key="row.id">
            <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
              <FlexRender
                :render="cell.column.columnDef.cell"
                :props="cell.getContext()" />
            </TableCell>
          </TableRow>
          <TableRow
            v-if="!table.getRowModel().rows?.length && showEmptyMessage">
            <TableCell
              :colspan="columns.length"
              class="h-16 text-center text-sm text-on-surface-variant">
              No members yet.
            </TableCell>
          </TableRow>
          <!-- extra rows such as the add-member form and its trigger, kept
               after the empty message so the trigger stays the last row -->
          <slot />
        </template>
      </TableBody>
    </Table>
  </div>
</template>

<script setup lang="ts" generic="TData">
import { ref } from "vue";
import type { ColumnDef, SortingState } from "@tanstack/vue-table";
import {
  FlexRender,
  getCoreRowModel,
  getSortedRowModel,
  useVueTable,
} from "@tanstack/vue-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-vue-next";
import Skeleton from "@/components/Skeleton/Skeleton.vue";

// Placeholder rows shown while the member list loads.
const SKELETON_ROW_COUNT = 3;

const props = withDefaults(
  defineProps<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    columns: ColumnDef<TData, any>[];
    data: TData[];
    isLoading?: boolean;
    // pass false while a slotted row (add form, in-flight member) occupies
    // the body, so "No members yet." doesn't show beside it
    showEmptyMessage?: boolean;
  }>(),
  { showEmptyMessage: true }
);

const sorting = ref<SortingState>([{ id: "name", desc: false }]);

const table = useVueTable({
  get data() {
    return props.data;
  },
  get columns() {
    return props.columns;
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  onSortingChange: (updater) => {
    sorting.value =
      typeof updater === "function" ? updater(sorting.value) : updater;
  },
  state: {
    get sorting() {
      return sorting.value;
    },
  },
});
</script>
