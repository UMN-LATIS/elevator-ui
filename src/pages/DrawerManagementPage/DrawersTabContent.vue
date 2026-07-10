<template>
  <div>
    <div class="flex justify-between items-center gap-x-8 gap-y-4 flex-wrap">
      <p class="text-sm flex-1">
        Drawers you can manage. Open one to work with its contents.
      </p>
      <InputGroup
        v-model="searchDrawerText"
        label="Search Drawers"
        placeholder="Search drawers"
        :labelHidden="true"
        class="max-w-sm"
        type="search"
        :disabled="isLoading">
        <template #prepend>
          <FilterIcon class="size-4 text-on-surface-variant" />
        </template>
      </InputGroup>
    </div>

    <div class="mt-4 border border-outline-variant rounded-md">
      <Table class="w-full">
        <TableHeader>
          <template
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id">
            <TableRow class="hover:bg-transparent">
              <TableHead
                v-for="header in headerGroup.headers"
                :key="header.id"
                class="bg-surface-container-low"
                :class="{
                  'cursor-pointer select-none': header.column.getCanSort(),
                }"
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
          </template>
        </TableHeader>
        <TableBody>
          <template v-if="isLoading">
            <TableRow
              v-for="row in SKELETON_ROW_COUNT"
              :key="`skeleton-${row}`">
              <TableCell v-for="(_, index) in drawerColumns" :key="index">
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
            <TableRow v-if="!table.getRowModel().rows.length">
              <TableCell
                :colspan="drawerColumns.length"
                class="h-16 text-center text-sm text-on-surface-variant">
                {{
                  drawers?.length
                    ? "No drawers match your filters."
                    : "No drawers yet."
                }}
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { useQuery } from "@tanstack/vue-query";
import type { SortingState } from "@tanstack/vue-table";
import {
  FlexRender,
  functionalUpdate,
  getCoreRowModel,
  getFilteredRowModel,
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
import { ArrowDown, ArrowUp, ArrowUpDown, FilterIcon } from "lucide-vue-next";
import Skeleton from "@/components/Skeleton/Skeleton.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import { manageableDrawersQuery } from "./drawerGroupQueries";
import { drawerColumns } from "./DrawersTableColumns";

const SKELETON_ROW_COUNT = 3;

const { data: drawers, isLoading } = useQuery(manageableDrawersQuery());

const searchDrawerText = ref("");
const sorting = ref<SortingState>([{ id: "title", desc: false }]);

const table = useVueTable({
  get data() {
    return drawers.value ?? [];
  },
  columns: drawerColumns,
  getRowId: (row) => String(row.id),
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  globalFilterFn: "includesString",
  onSortingChange: (updater) => {
    sorting.value = functionalUpdate(updater, sorting.value);
  },
  onGlobalFilterChange: (updater) => {
    searchDrawerText.value = functionalUpdate(updater, searchDrawerText.value);
  },
  state: {
    get sorting() {
      return sorting.value;
    },
    get globalFilter() {
      return searchDrawerText.value;
    },
  },
});
</script>
