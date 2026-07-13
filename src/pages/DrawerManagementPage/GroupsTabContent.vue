<template>
  <div>
    <div class="flex justify-between items-center gap-x-8 gap-y-4 flex-wrap">
      <p class="text-sm flex-1">
        Create a group to manage who your drawers are shared with.
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
              <TableRow
                :data-group-row="row.original.group.id"
                tabindex="-1"
                :aria-current="
                  isCurrentGroup(row.original.group.id) ? 'true' : undefined
                "
                :class="{
                  'border-b-transparent': row.getIsExpanded(),
                  'group-row--current': isCurrentGroup(row.original.group.id),
                  'opacity-50 pointer-events-none':
                    row.original.group.id === deletingGroupId,
                }">
                <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                  <FlexRender
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()" />
                </TableCell>
              </TableRow>
              <TableRow
                v-if="row.getIsExpanded()"
                :class="{
                  'group-row--current': isCurrentGroup(row.original.group.id),
                }">
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
                    class="bg-surface-container" />
                  <GroupEntriesManager
                    v-else-if="isAuthHelperGroupType(row.original.group)"
                    :group="row.original.group"
                    :isOpen="row.getIsExpanded()"
                    class="bg-surface-container" />
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
        <b>{{ groupPendingDelete?.label || groupPendingDelete?.type }}?</b>
        This action cannot be undone.
      </p>
    </ConfirmModal>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import { useQuery } from "@tanstack/vue-query";
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
import { ArrowDown, ArrowUp, ArrowUpDown, FilterIcon } from "lucide-vue-next";
import Button from "@/components/Button/Button.vue";
import Skeleton from "@/components/Skeleton/Skeleton.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal.vue";
import GroupFormModal from "./GroupFormModal.vue";
import GroupMemberManager from "./GroupMemberManager.vue";
import GroupEntriesManager from "./GroupEntriesManager.vue";
import {
  drawerGroupsQuery,
  drawerGroupTypesQuery,
  useDeleteDrawerGroupMutation,
} from "./drawerGroupQueries";
import { GROUP_TYPES, isAuthHelperGroupType, isManageableGroup } from "@/types";
import type {
  GroupTypeValues,
  GroupTypeDetails,
  PermissionsGroup,
} from "@/types";
import { tryFocus } from "@/helpers/tryFocus";
import { useToastStore } from "@/stores/toastStore";
import { createDrawerGroupColumns } from "./GroupsTableColumns";
import type { DrawerGroupRow } from "./GroupsTableColumns";

const SKELETON_ROW_COUNT = 3;

const GLOBAL_GROUP_TYPES: GroupTypeValues[] = [
  GROUP_TYPES.ALL,
  GROUP_TYPES.AUTHED,
  GROUP_TYPES.REMOTE,
];

const toastStore = useToastStore();
const { data: groups, isLoading } = useQuery(drawerGroupsQuery());
const { data: groupTypes } = useQuery(drawerGroupTypesQuery());
const deleteGroupMutation = useDeleteDrawerGroupMutation();

// the group being deleted
const deletingGroupId = computed((): number | null =>
  deleteGroupMutation.isPending.value
    ? deleteGroupMutation.variables.value ?? null
    : null
);

const groupTypesMap = computed((): Map<GroupTypeValues, GroupTypeDetails> => {
  const entries = groupTypes.value?.map((g) => [g.type, g] as const) ?? [];
  return new Map(entries);
});

const groupRows = computed((): DrawerGroupRow[] =>
  (groups.value ?? []).map((group) => {
    const typeDetails = groupTypesMap.value.get(group.type);
    return {
      group,
      name: group.label || group.type,
      typeLabel: group.is_personal
        ? "Personal"
        : typeDetails?.label ?? group.type,
      description: typeDetails?.description ?? "",
      entriesCount: group.entries_count,
      isGlobal: GLOBAL_GROUP_TYPES.includes(group.type),
      isPersonal: group.is_personal ?? false,
    };
  })
);

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

// the group awaiting delete confirmation, doubling as the modal's open state
const groupPendingDelete = ref<PermissionsGroup | null>(null);

function handleDelete(group: PermissionsGroup) {
  groupPendingDelete.value = group;
}

function confirmDelete() {
  const group = groupPendingDelete.value;
  if (!group) return;
  deleteGroupMutation.mutate(group.id, {
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

const groupColumns = createDrawerGroupColumns(openEdit, handleDelete);

const searchGroupText = ref("");
const sorting = ref<SortingState>([{ id: "name", desc: false }]);
// ids of the currently expanded rows, so each group fetches its members
// or entries only when its detail panel is open
const expanded = ref<ExpandedState>({});

// the group the user just created. Sorting, filtering, or expanding means
// the user has moved on, so the table's change handlers clear it.
const currentGroupId = ref<number | null>(null);

function isCurrentGroup(groupId: number): boolean {
  return groupId === currentGroupId.value;
}

// The personal group backs the owner's access to their own drawers, so
// the API refuses to touch it and the row offers nothing to manage.
function canExpandGroup(row: DrawerGroupRow): boolean {
  return isManageableGroup(row.group);
}

const table = useVueTable({
  get data() {
    return groupRows.value;
  },
  columns: groupColumns as ColumnDef<DrawerGroupRow, unknown>[],
  getRowId: (row) => String(row.group.id),
  getRowCanExpand: (row) => canExpandGroup(row.original),
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  globalFilterFn: "includesString",
  onSortingChange: (updater) => {
    currentGroupId.value = null;
    sorting.value = functionalUpdate(updater, sorting.value);
  },
  onExpandedChange: (updater) => {
    currentGroupId.value = null;
    expanded.value = functionalUpdate(updater, expanded.value);
  },
  onGlobalFilterChange: (updater) => {
    currentGroupId.value = null;
    searchGroupText.value = functionalUpdate(updater, searchGroupText.value);
  },
  state: {
    get sorting() {
      return sorting.value;
    },
    get expanded() {
      return expanded.value;
    },
    get globalFilter() {
      return searchGroupText.value;
    },
  },
});

// A User group's add-member row, an auth-helper group's add-entry row,
// or the edit button for global groups, which have no detail panel.
function focusSelectorForNewGroup(group: PermissionsGroup): string {
  if (group.type === GROUP_TYPES.USER) {
    return `[data-group-add-member="${group.id}"]`;
  }
  if (isAuthHelperGroupType(group)) {
    return `[data-group-entry-add-button="${group.id}"]`;
  }
  return `[data-group-edit="${group.id}"]`;
}

// Reveal a freshly created group and put focus where the user works next.
async function handleCreated(group: PermissionsGroup) {
  // an active search could hide the new row, so clear the search
  searchGroupText.value = "";
  currentGroupId.value = group.id;

  if (isManageableGroup(group)) {
    const groupId = String(group.id);
    const currentlyExpanded = expanded.value === true ? {} : expanded.value;
    expanded.value = { ...currentlyExpanded, [groupId]: true };
  }

  // The row, its detail panel, and the button mount across several
  // frames, so tryFocus retries until focus lands rather than
  // guessing a single tick.
  try {
    const focused = await tryFocus(focusSelectorForNewGroup(group));
    focused.scrollIntoView({ block: "nearest" });
    if (isManageableGroup(group)) {
      // clicking the add row opens its form, which then moves focus
      // into the input field
      focused.click();
    }
  } catch (error) {
    console.warn(`Could not focus new ${group.type} group`, error);
  }
}
</script>
<style scoped>
.group-row--current {
  animation: current-group-flash 0.5s ease-out;
}

@keyframes current-group-flash {
  from {
    background-color: var(--primary-muted);
  }
  to {
    background-color: transparent;
  }
}
</style>
