<template>
  <div>
    <div class="flex justify-between items-center gap-x-8 gap-y-4 flex-wrap">
      <p class="text-sm flex-1">
        Create a group to manage permissions for a set of users.
      </p>
      <div class="flex gap-2 items-center flex-wrap">
        <InputGroup
          v-model="searchGroupText"
          label="Search Groups"
          placeholder="Search groups"
          :labelHidden="true"
          class="max-w-sm"
          type="search"
          :disabled="isLoading">
          <template #prepend>
            <FilterIcon class="size-4 text-on-surface-variant" />
          </template>
        </InputGroup>
        <Button variant="primary" class="whitespace-nowrap" @click="openCreate">
          Create Group
        </Button>
      </div>
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
                :key="`filter-${header.id}`"
                class="bg-surface-container-low py-2">
                <InputGroup
                  v-if="header.column.getCanFilter()"
                  :label="
                    header.column.columnDef.meta?.filterPlaceholder ?? 'Filter'
                  "
                  :labelHidden="true"
                  :placeholder="header.column.columnDef.meta?.filterPlaceholder"
                  type="search"
                  class="max-w-xs"
                  :disabled="isLoading"
                  :modelValue="String(header.column.getFilterValue() ?? '')"
                  @update:modelValue="
                    header.column.setFilterValue($event || undefined)
                  " />
              </TableHead>
            </TableRow>
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
              <TableCell v-for="(_, index) in groupColumns" :key="index">
                <Skeleton height="1rem" width="70%" />
              </TableCell>
            </TableRow>
          </template>
          <template v-else>
            <template v-for="row in table.getRowModel().rows" :key="row.id">
              <TableRow :class="row.getIsExpanded() && 'border-b-transparent'">
                <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                  <FlexRender
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()" />
                </TableCell>
              </TableRow>
              <TableRow v-if="row.getIsExpanded()">
                <TableCell
                  :colspan="row.getVisibleCells().length"
                  class="px-4 pb-4 pl-12">
                  <p
                    v-if="row.original.description"
                    class="mb-4 text-sm text-on-surface-variant">
                    {{ row.original.description }}
                  </p>
                  <GroupMemberManager
                    v-if="row.original.group.type === GROUP_TYPES.USER"
                    :group="row.original.group"
                    :isOpen="row.getIsExpanded()"
                    class="bg-surface-container-low" />
                  <GroupEntriesManager
                    v-else-if="isAuthHelperGroupType(row.original.group)"
                    :group="row.original.group"
                    :isOpen="row.getIsExpanded()" />
                </TableCell>
              </TableRow>
            </template>
            <TableRow v-if="!table.getRowModel().rows.length">
              <TableCell
                :colspan="groupColumns.length"
                class="h-16 text-center text-sm text-on-surface-variant">
                {{
                  groupRows.length
                    ? "No groups match your filters."
                    : "No groups yet. Create one to get started."
                }}
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>

    <p class="mt-2 text-xs text-on-surface-variant">
      Global groups (All, Authenticated Users) apply to everyone and have no
      members to manage.
    </p>

    <GroupFormModal
      :isOpen="isGroupModalOpen"
      :group="editingGroup"
      @close="closeGroupModal"
      @created="handleCreated" />

    <ConfirmModal
      :isOpen="Boolean(groupPendingDelete)"
      title="Delete Group"
      type="danger"
      confirmLabel="Delete"
      @close="groupPendingDelete = null"
      @confirm="confirmDelete">
      <p>
        Are you sure you want to delete group
        <b>{{ groupPendingDelete?.label || groupPendingDelete?.type }}</b>
        ? This action cannot be undone.
      </p>
    </ConfirmModal>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import { useQuery } from "@tanstack/vue-query";
import type {
  ColumnDef,
  ColumnFiltersState,
  ExpandedState,
  SortingState,
} from "@tanstack/vue-table";
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
import { ArrowDown, ArrowUp, ArrowUpDown, FilterIcon } from "lucide-vue-next";
import Button from "@/components/Button/Button.vue";
import Skeleton from "@/components/Skeleton/Skeleton.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal.vue";
import GroupFormModal from "./GroupFormModal.vue";
import GroupMemberManager from "./GroupMemberManager.vue";
import GroupEntriesManager from "./GroupEntriesManager.vue";
import {
  groupsQuery,
  groupTypesQuery,
  useDeleteGroupMutation,
} from "./groupQueries";
import { GROUP_TYPES } from "@/types";
import type {
  GroupTypeValues,
  GroupTypeDetails,
  PermissionsGroup,
} from "@/types";
import { tryFocus } from "@/helpers/tryFocus";
import { useToastStore } from "@/stores/toastStore";
import { createGroupColumns } from "./GroupsTableColumns";
import type { GroupRow } from "./GroupsTableColumns";
import { cn } from "@/lib/utils.js";

// Placeholder rows shown while the group list loads.
const SKELETON_ROW_COUNT = 3;

// Global groups match everyone by definition, so the table shows no
// member count and no expandable detail panel for them.
const GLOBAL_GROUP_TYPES: GroupTypeValues[] = [
  GROUP_TYPES.ALL,
  GROUP_TYPES.AUTHED,
  GROUP_TYPES.REMOTE,
];

const toastStore = useToastStore();
const { data: groups, isLoading } = useQuery(groupsQuery());
const { data: groupTypes } = useQuery(groupTypesQuery());
const { mutate: deleteGroup } = useDeleteGroupMutation();

const groupTypesMap = computed((): Map<GroupTypeValues, GroupTypeDetails> => {
  const entries = groupTypes.value?.map((g) => [g.type, g] as const) ?? [];
  return new Map(entries);
});

const groupRows = computed((): GroupRow[] =>
  (groups.value ?? []).map((group) => {
    const typeDetails = groupTypesMap.value.get(group.type);
    return {
      group,
      name: group.label || group.type,
      typeLabel: typeDetails?.label ?? group.type,
      description: typeDetails?.description ?? "",
      entriesCount: group.entries_count,
      isGlobal: GLOBAL_GROUP_TYPES.includes(group.type),
    };
  })
);

// Auth-helper types are defined per campus by the backend's AuthHelper
// classes, so the UI can only recognize them as "not one of the built-in
// GROUP_TYPES". The backend rejects entry writes on other types anyway.
function isAuthHelperGroupType(group: PermissionsGroup): boolean {
  const builtInTypes: GroupTypeValues[] = Object.values(GROUP_TYPES);
  return !builtInTypes.includes(group.type);
}

// A row expands only when there is something to manage inside: User
// groups manage members, auth-helper groups manage match values.
function isManageableGroup(group: PermissionsGroup): boolean {
  return group.type === GROUP_TYPES.USER || isAuthHelperGroupType(group);
}

const editingGroup = ref<PermissionsGroup | null>(null);
const isGroupModalOpen = ref(false);

function openCreate() {
  editingGroup.value = null;
  isGroupModalOpen.value = true;
}

function openEdit(group: PermissionsGroup) {
  editingGroup.value = group;
  isGroupModalOpen.value = true;
}

function closeGroupModal() {
  isGroupModalOpen.value = false;
}

// the group awaiting delete confirmation; also drives the modal's open state
const groupPendingDelete = ref<PermissionsGroup | null>(null);

function handleDelete(group: PermissionsGroup) {
  groupPendingDelete.value = group;
}

function confirmDelete() {
  const group = groupPendingDelete.value;
  if (!group) return;
  deleteGroup(group.id, {
    onSuccess: () =>
      toastStore.addToast({
        message: `Group "${group.label || group.type}" deleted.`,
        variant: "success",
      }),
    onError: (error) =>
      toastStore.addToast({
        title: "Delete Group Failed",
        message: `Failed to delete group "${group.label || group.type}": ${
          error.message
        }`,
        variant: "error",
      }),
  });
  groupPendingDelete.value = null;
}

const groupColumns = createGroupColumns(openEdit, handleDelete);

const searchGroupText = ref("");
const sorting = ref<SortingState>([{ id: "name", desc: false }]);
const columnFilters = ref<ColumnFiltersState>([]);
// ids of the currently expanded rows, so each group fetches its members
// or entries only when its detail panel is open
const expanded = ref<ExpandedState>({});

const table = useVueTable({
  get data() {
    return groupRows.value;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: groupColumns as ColumnDef<GroupRow, any>[],
  getRowId: (row) => String(row.group.id),
  getRowCanExpand: (row) => isManageableGroup(row.original.group),
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  globalFilterFn: "includesString",
  onSortingChange: (updater) => {
    sorting.value =
      typeof updater === "function" ? updater(sorting.value) : updater;
  },
  onColumnFiltersChange: (updater) => {
    columnFilters.value =
      typeof updater === "function" ? updater(columnFilters.value) : updater;
  },
  onExpandedChange: (updater) => {
    expanded.value =
      typeof updater === "function" ? updater(expanded.value) : updater;
  },
  onGlobalFilterChange: (updater) => {
    searchGroupText.value =
      typeof updater === "function" ? updater(searchGroupText.value) : updater;
  },
  state: {
    get sorting() {
      return sorting.value;
    },
    get columnFilters() {
      return columnFilters.value;
    },
    get expanded() {
      return expanded.value;
    },
    get globalFilter() {
      return searchGroupText.value;
    },
  },
});

// Open a freshly created group and move focus into it: a User group opens
// its add-member form so the admin can start adding people, other
// manageable types land on the row's expand button. Global groups have no
// panel to open, so focus stays put. The row, its detail panel, and the
// button mount across several frames, so tryFocus retries until focus
// lands rather than guessing a single tick.
async function handleCreated(group: PermissionsGroup) {
  if (!isManageableGroup(group)) return;

  const groupId = String(group.id);
  const currentlyExpanded = expanded.value === true ? {} : expanded.value;
  expanded.value = { ...currentlyExpanded, [groupId]: true };

  const isUserGroup = group.type === GROUP_TYPES.USER;
  const selector = isUserGroup
    ? `[data-group-add-member="${group.id}"]`
    : `[data-group-trigger="${group.id}"]`;

  try {
    const focused = await tryFocus(selector);
    if (isUserGroup) {
      // clicking the Add Member row opens the form, which then moves
      // focus into its search field
      focused.click();
    } else {
      focused.scrollIntoView({ block: "nearest" });
    }
  } catch (error) {
    console.warn(`Could not focus new ${group.type} group`, error);
  }
}
</script>
