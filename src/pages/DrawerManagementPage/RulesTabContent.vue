<template>
  <div class="mt-4 border border-outline-variant rounded-md">
    <Table class="w-full table-fixed">
      <TableHeader>
        <template
          v-for="headerGroup in table.getHeaderGroups()"
          :key="headerGroup.id">
          <TableRow class="hover:bg-transparent">
            <TableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              class="bg-surface-container-low"
              :class="header.column.columnDef.meta?.widthClass">
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()" />
            </TableHead>
          </TableRow>
        </template>
      </TableHeader>
      <TableBody>
        <template v-if="isLoading">
          <TableRow v-for="row in SKELETON_ROW_COUNT" :key="`skeleton-${row}`">
            <TableCell v-for="(_, index) in ruleColumns" :key="index">
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
              :colspan="ruleColumns.length"
              class="h-16 text-center text-sm"
              :class="isError ? 'text-error' : 'text-on-surface-variant'">
              {{ isError ? "Could not load rules." : "No rules yet." }}
            </TableCell>
          </TableRow>
        </template>
      </TableBody>
    </Table>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { FlexRender, getCoreRowModel, useVueTable } from "@tanstack/vue-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Skeleton from "@/components/Skeleton/Skeleton.vue";
import { createRuleColumns } from "./RulesTableColumns";
import { buildRuleRows } from "./buildRuleRows";
import type { DrawerRuleRow } from "./buildRuleRows";
import { drawerGrantsQuery } from "./drawerGrantQueries";
import { manageableDrawersQuery } from "./drawerGroupQueries";
import { permissionLevelsQuery } from "@/queries/permissionLevelsQuery";

const SKELETON_ROW_COUNT = 3;

const {
  data: grants,
  isLoading: isLoadingGrants,
  isError: isGrantsError,
} = useQuery(drawerGrantsQuery());
const {
  data: drawers,
  isLoading: isLoadingDrawers,
  isError: isDrawersError,
} = useQuery(manageableDrawersQuery());
const {
  data: permissionLevels,
  isLoading: isLoadingLevels,
  isError: isLevelsError,
} = useQuery(permissionLevelsQuery());

// rows join all three sources, so any one still loading means no rows yet
const isLoading = computed(
  () => isLoadingGrants.value || isLoadingDrawers.value || isLoadingLevels.value
);

// each source falls back to [], so one failing looks identical to no rules
const isError = computed(
  () => isGrantsError.value || isDrawersError.value || isLevelsError.value
);

const ruleRows = computed(() =>
  buildRuleRows({
    grants: grants.value ?? [],
    drawers: drawers.value ?? [],
    permissionLevels: permissionLevels.value ?? [],
  })
);

function handleEdit(rule: DrawerRuleRow): void {
  // TODO: inline permission editing
  console.log("edit rule", rule.id);
}

function handleDelete(rule: DrawerRuleRow): void {
  // TODO: delete confirmation
  console.log("delete rule", rule.id);
}

const ruleColumns = createRuleColumns(handleEdit, handleDelete);

const table = useVueTable({
  get data() {
    return ruleRows.value;
  },
  columns: ruleColumns,
  getRowId: (row) => String(row.id),
  getCoreRowModel: getCoreRowModel(),
});
</script>
