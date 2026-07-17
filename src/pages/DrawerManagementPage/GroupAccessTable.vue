<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
      <p class="flex-1 text-sm">
        Share a drawer by assigning permissions to an existing drawer group or
        creating a new one.
      </p>
      <div class="flex flex-wrap items-center gap-2">
        <InputGroup
          :modelValue="searchText"
          label="Search Groups"
          placeholder="Search groups"
          :labelHidden="true"
          class="max-w-sm"
          type="search"
          :disabled="isLoading"
          @update:modelValue="searchGroups">
          <template #prepend>
            <FilterIcon class="size-4 text-on-surface-variant" />
          </template>
        </InputGroup>
        <Button
          variant="primary"
          class="whitespace-nowrap"
          @click="openAddGroupForm">
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
              <TableCell v-for="(_, index) in groupAccessColumns" :key="index">
                <Skeleton height="1rem" width="70%" />
              </TableCell>
            </TableRow>
          </template>
          <template v-else>
            <template v-for="row in table.getRowModel().rows" :key="row.id">
              <TableRow
                :data-group-row="row.original.id"
                tabindex="-1"
                :aria-current="
                  isCurrentGroup(row.original.id) ? 'true' : undefined
                "
                :class="{
                  'border-b-transparent': row.getIsExpanded(),
                  'group-row--current': isCurrentGroup(row.original.id),
                  'bg-surface-container-low': !hasAccess(row.original),
                  'opacity-50 pointer-events-none':
                    row.original.id === deletingGroupId,
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
                  'group-row--current': isCurrentGroup(row.original.id),
                  'bg-surface-container-low': !hasAccess(row.original),
                }">
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
                :colspan="groupAccessColumns.length"
                class="h-16 text-center text-sm"
                :class="isError ? 'text-error' : 'text-on-surface-variant'">
                {{ emptyMessage }}
              </TableCell>
            </TableRow>

            <AddGroupRow
              v-model:open="isAddingGroup"
              :drawerId="drawerId"
              :colspan="groupAccessColumns.length"
              @created="revealNewGroup" />
            <AddRowButton
              v-if="!isAddingGroup"
              :colspan="groupAccessColumns.length"
              label="New Group"
              @click="openAddGroupForm" />
          </template>
        </TableBody>
      </Table>
    </div>

    <ConfirmModal
      :isOpen="Boolean(groupPendingDelete)"
      title="Delete Group"
      type="danger"
      confirmLabel="Delete"
      @close="groupPendingDelete = null"
      @confirm="confirmDeleteGroup">
      <p>
        Are you sure you want to delete
        <b>{{ groupPendingDelete?.groupLabel }}?</b>
        Everyone in it loses the access it grants, on this drawer and on any
        other. This action cannot be undone.
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
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import Skeleton from "@/components/Skeleton/Skeleton.vue";
import { buildPermissionOptions } from "@/components/PermissionSelect/buildPermissionOptions";
import { tryFocus } from "@/helpers/tryFocus";
import AddGroupRow from "./AddGroupRow.vue";
import AddRowButton from "../AdminPermissionsPage/AddRowButton.vue";
import GroupEntriesManager from "./GroupEntriesManager.vue";
import GroupMemberManager from "./GroupMemberManager.vue";
import { createGroupAccessColumns } from "./GroupAccessTableColumns";
import type { SavingRow } from "./GroupAccessTableColumns";
import { buildGroupAccessRows } from "./buildGroupAccessRows";
import type { GroupAccessRow } from "./buildGroupAccessRows";
import {
  drawerGrantsQuery,
  useCreateDrawerGrantMutation,
  useDeleteDrawerGrantMutation,
  useUpdateDrawerGrantMutation,
} from "./drawerGrantQueries";
import {
  drawerGroupsQuery,
  drawerGroupTypesQuery,
  useDeleteDrawerGroupMutation,
  useRenameDrawerGroupMutation,
} from "./drawerGroupQueries";
import { permissionLevelsQuery } from "@/queries/permissionLevelsQuery";
import { useToastStore } from "@/stores/toastStore";
import { GROUP_TYPES, PERM, isManageableGroup } from "@/types";
import type { DrawerGrantGroup, PermissionsGroup } from "@/types";

const SKELETON_ROW_COUNT = 3;

const props = defineProps<{ drawerId: number }>();

const toastStore = useToastStore();

const {
  data: grants,
  isLoading: isLoadingGrants,
  isError: isGrantsError,
} = useQuery(drawerGrantsQuery());
const {
  data: groups,
  isLoading: isLoadingGroups,
  isError: isGroupsError,
} = useQuery(drawerGroupsQuery());
const {
  data: groupTypes,
  isLoading: isLoadingTypes,
  isError: isTypesError,
} = useQuery(drawerGroupTypesQuery());
const {
  data: permissionLevels,
  isLoading: isLoadingLevels,
  isError: isLevelsError,
} = useQuery(permissionLevelsQuery());

// rows join all four sources, so any one still loading means no rows yet
const isLoading = computed(
  () =>
    isLoadingGrants.value ||
    isLoadingGroups.value ||
    isLoadingTypes.value ||
    isLoadingLevels.value
);

// each source falls back to [], so one failing looks identical to no groups
const isError = computed(
  () =>
    isGrantsError.value ||
    isGroupsError.value ||
    isTypesError.value ||
    isLevelsError.value
);

const groupRows = computed(() =>
  buildGroupAccessRows({
    grants: grants.value ?? [],
    ownGroups: groups.value ?? [],
    drawerId: props.drawerId,
    permissionLevels: permissionLevels.value ?? [],
    groupTypes: groupTypes.value ?? [],
  })
);

const emptyMessage = computed((): string => {
  if (isError.value) return "Could not load groups.";
  // the table renders this only when no row is visible, so groups that
  // exist are groups the search hid
  if (groupRows.value.length > 0) return "No groups match your search.";
  return "No groups yet. Create one to share this drawer.";
});

// A group holds members or entries to manage, and the API answers for
// those only when the caller owns the group.
// TODO: drop the ownedByCurrentUser check once the API scopes group
// reads and writes to the drawers the caller manages.
function canOpenGroup(group: DrawerGrantGroup): boolean {
  return isManageableGroup(group) && group.ownedByCurrentUser;
}

const isAddingGroup = ref(false);

function openAddGroupForm() {
  isAddingGroup.value = true;

  // focus the form's first field after next render
  tryFocus(".add-group__name-input").catch((error) =>
    console.warn("Could not focus the new group's name", error)
  );
}

// only one row edits at a time, so one set of drafts covers the table
const editingRowId = ref<number | null>(null);
const draftLabel = ref("");
const draftLevelId = ref<number | null>(null);
const createGrant = useCreateDrawerGrantMutation();
const updateGrant = useUpdateDrawerGrantMutation();
const deleteGrant = useDeleteDrawerGrantMutation();
const renameGroup = useRenameDrawerGroupMutation();

const permissionOptions = computed(() =>
  buildPermissionOptions(permissionLevels.value ?? [])
);

// Level 0 is what "no access" submits, since a rule granting nothing and
// no rule at all resolve the same.
function toNoAccessLevelId(): number | null {
  const noAccessLevel = (permissionLevels.value ?? []).find(
    (level) => level.level === PERM.NOPERM
  );
  return noAccessLevel?.id ?? null;
}

// The level a row sits at, which for a group holding no rule is level 0
// rather than nothing: the editor opens on where the group stands.
function toEditableLevelId(row: GroupAccessRow): number | null {
  return row.permissionLevelId ?? toNoAccessLevelId();
}

function startEdit(row: GroupAccessRow) {
  editingRowId.value = row.id;
  draftLabel.value = row.group.label;
  draftLevelId.value = toEditableLevelId(row);
}

function cancelEdit() {
  editingRowId.value = null;
  draftLabel.value = "";
  draftLevelId.value = null;
}

// What a group is called and what it can reach are separate resources,
// so one Save can send one request, the other, or both.
function saveEdit(row: GroupAccessRow) {
  const label = draftLabel.value.trim();
  const levelId = draftLevelId.value;
  cancelEdit();

  submittedRow.value = {
    id: row.id,
    // someone else's group keeps the name it has, since only its access
    // was up for editing
    groupLabel: row.group.ownedByCurrentUser && label ? label : row.groupLabel,
    levelLabel: toLevelLabel(levelId),
  };

  saveGroupName(row, label);
  if (levelId !== null) {
    saveAccess(row, levelId);
  }
}

function saveGroupName(row: GroupAccessRow, label: string) {
  // renaming reaches the caller's own groups only
  if (!row.group.ownedByCurrentUser) return;
  if (!label) return;
  if (label === row.group.label) return;

  renameGroup.mutate(
    { id: row.id, label },
    {
      onSuccess: () =>
        toastStore.success(`Group "${row.group.label}" renamed to "${label}".`),
      onError: (error) =>
        toastStore.error(
          `Failed to rename group "${row.group.label}": ${error.message}`,
          { title: "Rename Group Failed" }
        ),
    }
  );
}

// Level 0 is a level like any other here: the legacy editor writes rules
// that hold it, so the editor sets one rather than reading it as an
// instruction to delete the rule. Remove Permissions is what deletes.
function saveAccess(row: GroupAccessRow, levelId: number) {
  if (levelId === toEditableLevelId(row)) return;

  const accessToasts = {
    onSuccess: () =>
      toastStore.success(
        `"${row.groupLabel}" access set to ${toLevelLabel(levelId)}.`
      ),
    onError: (error: Error) =>
      toastStore.error(
        `Failed to set access for "${row.groupLabel}": ${error.message}`,
        { title: "Save Access Failed" }
      ),
  };

  if (row.grantId === null) {
    createGrant.mutate(
      {
        drawerId: props.drawerId,
        drawerGroupId: row.id,
        permissionLevelId: levelId,
      },
      accessToasts
    );
    return;
  }

  updateGrant.mutate(
    { grantId: row.grantId, permissionLevelId: levelId },
    accessToasts
  );
}

// What the row that was saved submitted, which its cells show while the
// lists still hold the values it replaced.
const submittedRow = ref<SavingRow | null>(null);

// One Save can fire a group request and an access request, and either
// can be the one still running.
const isSaveInFlight = computed(
  (): boolean =>
    renameGroup.isPending.value ||
    createGrant.isPending.value ||
    updateGrant.isPending.value ||
    deleteGrant.isPending.value
);

const savingRow = computed((): SavingRow | null =>
  isSaveInFlight.value ? submittedRow.value : null
);

function toLevelLabel(levelId: number | null): string {
  const option = permissionOptions.value.find(
    (candidate) => candidate.id === levelId
  );
  return option?.label ?? "";
}

/**
 * Take the group's rule off this drawer, which also drops the group's
 * link to it.
 *
 * The API refuses to delete a rule on someone else's group, so that one
 * is levelled to 0 instead. Access resolves to the highest matching
 * level, so both leave the group reaching nothing.
 */
function removePermissions(row: GroupAccessRow) {
  if (row.grantId === null) return;

  const noAccessLevelId = toNoAccessLevelId();

  const removalToasts = {
    onSuccess: () =>
      toastStore.success(`Permissions removed from "${row.groupLabel}".`),
    onError: (error: Error) =>
      toastStore.error(
        `Failed to remove permissions from "${row.groupLabel}": ${error.message}`,
        { title: "Remove Permissions Failed" }
      ),
  };

  const removal: SavingRow = {
    id: row.id,
    groupLabel: row.groupLabel,
    levelLabel: toLevelLabel(noAccessLevelId),
  };

  if (row.group.ownedByCurrentUser) {
    submittedRow.value = removal;
    deleteGrant.mutate(row.grantId, removalToasts);
    return;
  }

  // Levelling to 0 is the only way to revoke another owner's rule, so
  // without that level there is nothing to submit.
  if (noAccessLevelId === null) {
    toastStore.error(
      "This instance has no No Permissions level to revoke access with.",
      { title: "Remove Permissions Failed" }
    );
    return;
  }

  submittedRow.value = removal;
  updateGrant.mutate(
    { grantId: row.grantId, permissionLevelId: noAccessLevelId },
    removalToasts
  );
}

// the group awaiting delete confirmation, doubling as the modal's open state
const groupPendingDelete = ref<GroupAccessRow | null>(null);
const deleteGroup = useDeleteDrawerGroupMutation();

function askToDeleteGroup(row: GroupAccessRow) {
  groupPendingDelete.value = row;
}

function confirmDeleteGroup() {
  const row = groupPendingDelete.value;
  groupPendingDelete.value = null;
  if (!row) return;

  deleteGroup.mutate(row.id, {
    onSuccess: () => toastStore.success(`Group "${row.groupLabel}" deleted.`),
    onError: (error) =>
      toastStore.error(
        `Failed to delete group "${row.groupLabel}": ${error.message}`,
        { title: "Delete Group Failed" }
      ),
  });
}

// the group being deleted, whose row grays out until the refetch drops it
const deletingGroupId = computed((): number | null => {
  if (!deleteGroup.isPending.value) return null;
  return deleteGroup.variables.value ?? null;
});

const groupAccessColumns = createGroupAccessColumns({
  editingRowId,
  draftLabel,
  draftLevelId,
  savingRow,
  permissionOptions,
  onEdit: startEdit,
  onCancel: cancelEdit,
  onSave: saveEdit,
  onRemovePermissions: removePermissions,
  onDeleteGroup: askToDeleteGroup,
});

// The rows arrive with the groups that reach this drawer first, so the
// table sorts by nothing until a header says otherwise.
const sorting = ref<SortingState>([]);

// One search box filters across every text column.
const searchText = ref("");

// ids of the currently expanded rows, so each group fetches its members
// or entries only when its detail panel is open
const expanded = ref<ExpandedState>({});

// the group the user just created. Sorting, searching, or expanding means
// the user has moved on, so those handlers clear it.
const currentGroupId = ref<number | null>(null);

// Typing in the search box means the user moved on from the group they
// just created. revealNewGroup writes searchText directly, since it
// clears the box to show that group rather than to leave it.
function searchGroups(text: string): void {
  searchText.value = text;
  currentGroupId.value = null;
}

function isCurrentGroup(groupId: number): boolean {
  return groupId === currentGroupId.value;
}

// A group that reaches nothing on this drawer is background to the ones
// that do, so its row sits back rather than reading as an equal.
function hasAccess(row: GroupAccessRow): boolean {
  return row.permissionLevelNumber > 0;
}

const table = useVueTable({
  get data() {
    return groupRows.value;
  },
  columns: groupAccessColumns as ColumnDef<GroupAccessRow, unknown>[],
  getRowId: (row) => String(row.id),
  getRowCanExpand: (row) => canOpenGroup(row.original.group),
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
  state: {
    get sorting() {
      return sorting.value;
    },
    get expanded() {
      return expanded.value;
    },
    get globalFilter() {
      return searchText.value;
    },
  },
});

// `expanded` is either true, meaning every row, or a per-row map, so
// opening one row has to preserve whichever it currently holds.
function expandGroupRow(groupId: number): void {
  const currentlyExpanded = expanded.value === true ? {} : expanded.value;
  expanded.value = { ...currentlyExpanded, [String(groupId)]: true };
}

// A new group holds nobody and reaches nothing, so its row opens on the
// members it needs before its permission is worth setting.
async function revealNewGroup(group: PermissionsGroup): Promise<void> {
  // an active search could hide the new row, so clear the search
  searchText.value = "";
  currentGroupId.value = group.id;

  // A global group type reaches its people by rule and holds nobody, so
  // its row has nothing to open and the row itself takes focus.
  if (!isManageableGroup(group)) {
    await focusNewGroup(group, `[data-group-row="${group.id}"]`);
    return;
  }

  expandGroupRow(group.id);
  const addRowSelector =
    group.type === GROUP_TYPES.USER
      ? `[data-group-add-member="${group.id}"]`
      : `[data-group-entry-add-button="${group.id}"]`;

  const addRow = await focusNewGroup(group, addRowSelector);
  // clicking the add row opens its form, which then moves focus into the
  // field the user came here to fill
  addRow?.click();
}

// The row, its detail panel, and the button inside it mount across
// several frames, so tryFocus retries until focus lands rather than
// guessing a single tick.
async function focusNewGroup(
  group: PermissionsGroup,
  selector: string
): Promise<HTMLElement | null> {
  try {
    const focused = await tryFocus(selector);
    focused.scrollIntoView({ block: "nearest" });
    return focused;
  } catch (error) {
    console.warn(`Could not focus new ${group.type} group`, error);
    return null;
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
