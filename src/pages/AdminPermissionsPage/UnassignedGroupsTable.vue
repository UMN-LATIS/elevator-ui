<template>
  <div class="border border-outline-variant rounded-md">
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
              :class="[
                header.column.columnDef.meta?.widthClass,
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
        </template>
      </TableHeader>
      <TableBody>
        <template v-for="row in table.getRowModel().rows" :key="row.id">
          <TableRow
            tabindex="-1"
            :class="{
              'border-b-transparent': row.getIsExpanded(),
              'opacity-50 pointer-events-none':
                row.original.group.id === deletingGroupId,
            }">
            <TableCell
              v-for="cell in row.getVisibleCells()"
              :key="cell.id"
              :class="{
                'align-top': editingGroupId === row.original.group.id,
              }">
              <FlexRender
                :render="cell.column.columnDef.cell"
                :props="cell.getContext()" />
            </TableCell>
          </TableRow>
          <TableRow v-if="row.getIsExpanded()">
            <TableCell
              :colspan="row.getVisibleCells().length"
              class="px-4 pb-4 pl-12">
              <GroupMemberManager
                v-if="row.original.group.type === GROUP_TYPES.USER"
                :group="row.original.group"
                :isOpen="row.getIsExpanded()"
                class="bg-surface-container" />
              <GroupEntriesManager
                v-else
                :group="row.original.group"
                :isOpen="row.getIsExpanded()"
                class="bg-surface-container" />
            </TableCell>
          </TableRow>
        </template>
        <TableRow v-if="!table.getRowModel().rows.length">
          <TableCell
            :colspan="unassignedGroupColumns.length"
            class="h-16 text-center text-sm text-on-surface-variant">
            No groups match your search.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import type {
  ColumnDef,
  ExpandedState,
  SortingState,
} from "@tanstack/vue-table";
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
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-vue-next";
import GroupEntriesManager from "./GroupEntriesManager.vue";
import GroupMemberManager from "./GroupMemberManager.vue";
import { useUpdateGroupMutation } from "./groupQueries";
import { createUnassignedGroupColumns } from "./UnassignedGroupsTableColumns";
import type { SavingGroup } from "./UnassignedGroupsTableColumns";
import type { UnassignedGroupRow } from "./buildPermissionsPageRows";
import { GROUP_TYPES, isManageableGroup } from "@/types";
import type { PermissionsGroup } from "@/types";

const props = defineProps<{
  rows: UnassignedGroupRow[];
  // the page's one search box, shared with the permissions table
  searchText: string;
  // the group mid-delete, so its row grays out until the refetch drops it
  deletingGroupId: number | null;
}>();

const emit = defineEmits<{
  addPermission: [group: PermissionsGroup];
  deleteGroup: [group: PermissionsGroup];
}>();

// only one row edits at a time, so one draft covers the table
const editingGroupId = ref<number | null>(null);
const draftLabel = ref("");
const updateGroup = useUpdateGroupMutation();

function startEdit(row: UnassignedGroupRow) {
  editingGroupId.value = row.group.id;
  draftLabel.value = row.group.label;
}

function cancelEdit() {
  editingGroupId.value = null;
  draftLabel.value = "";
}

function saveEdit(row: UnassignedGroupRow) {
  const label = draftLabel.value.trim();
  cancelEdit();
  if (!label) return;
  if (label === row.group.label) return;

  // a group's type is fixed at creation, so the update resends it as is
  updateGroup.mutate({
    id: row.group.id,
    payload: { label, type: row.group.type },
  });
}

// The submitted rename, which the row shows while the groups list still
// holds the name it replaced. isPending stays true through the refetch
// because the mutation's onSettled returns its promise.
const savingGroup = computed((): SavingGroup | null => {
  const vars = updateGroup.variables.value;
  if (!updateGroup.isPending.value || !vars) return null;
  return { groupId: vars.id, groupLabel: vars.payload.label };
});

const unassignedGroupColumns = createUnassignedGroupColumns({
  editingGroupId,
  draftLabel,
  savingGroup,
  onEdit: startEdit,
  onCancel: cancelEdit,
  onSave: saveEdit,
  onAddPermission: (row) => emit("addPermission", row.group),
  onDeleteGroup: (row) => emit("deleteGroup", row.group),
});

// the rows arrive sorted by name, so the table sorts by nothing until a
// header says otherwise
const sorting = ref<SortingState>([]);

// ids of the currently expanded rows, so each group fetches its members
// or entries only when its detail panel is open
const expanded = ref<ExpandedState>({});

const table = useVueTable({
  get data() {
    return props.rows;
  },
  columns: unassignedGroupColumns as ColumnDef<UnassignedGroupRow, unknown>[],
  getRowId: (row) => String(row.group.id),
  getRowCanExpand: (row) => isManageableGroup(row.original.group),
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  globalFilterFn: "includesString",
  onSortingChange: (updater) => {
    sorting.value = functionalUpdate(updater, sorting.value);
  },
  onExpandedChange: (updater) => {
    expanded.value = functionalUpdate(updater, expanded.value);
  },
  state: {
    get sorting() {
      return sorting.value;
    },
    get expanded() {
      return expanded.value;
    },
    get globalFilter() {
      return props.searchText;
    },
  },
});
</script>
