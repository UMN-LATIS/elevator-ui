<template>
  <div class="flex flex-col gap-4">
    <InputGroup
      v-model="globalFilter"
      label="Search table"
      type="text"
      placeholder="Filter pages..."
      :labelHidden="true"
      class="max-w-sm" />
    <div class="border border-outline-variant rounded-md">
      <Table class="table-fixed w-full">
        <TableHeader>
          <TableRow
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id">
            <TableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              :style="{ width: `${header.getSize()}px` }"
              class="bg-surface-container-lowest"
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
                    class="h-4 w-4 text-muted-foreground/50" />
                  <ArrowUp
                    v-else-if="header.column.getIsSorted() === 'asc'"
                    class="h-4 w-4" />
                  <ArrowDown v-else class="h-4 w-4" />
                </template>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
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
          </template>
          <template v-else>
            <TableRow>
              <TableCell :colspan="columns.length" class="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>
  </div>
</template>

<script setup lang="ts" generic="TData">
import { computed, ref } from "vue";
import type { ColumnDef, SortingState, VisibilityState } from "@tanstack/vue-table";
import { useMediaQuery } from "@vueuse/core";
import {
  FlexRender,
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
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-vue-next";
import InputGroup from "@/components/InputGroup/InputGroup.vue";

const props = defineProps<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[];
  data: TData[];
}>();

const isSmScreen = useMediaQuery("(min-width: 640px)");
const isLgScreen = useMediaQuery("(min-width: 1024px)");

const columnVisibility = computed<VisibilityState>(() => ({
  parentTitle: isSmScreen.value,
  includeInHeader: isSmScreen.value,
  body: isLgScreen.value,
  createdAt: isLgScreen.value,
  modifiedAt: isLgScreen.value,
}));

const sorting = ref<SortingState>([{ id: "title", desc: false }]);
const globalFilter = ref("");

const table = useVueTable({
  get data() {
    return props.data;
  },
  get columns() {
    return props.columns;
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  onSortingChange: (updater) => {
    sorting.value =
      typeof updater === "function" ? updater(sorting.value) : updater;
  },
  state: {
    get sorting() {
      return sorting.value;
    },
    get globalFilter() {
      return globalFilter.value;
    },
    get columnVisibility() {
      return columnVisibility.value;
    },
  },
});
</script>
