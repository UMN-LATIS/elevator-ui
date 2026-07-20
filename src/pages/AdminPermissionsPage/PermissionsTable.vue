<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
      <div
        aria-label="Permission filters"
        class="flex flex-wrap items-center gap-x-2 gap-y-2 rounded-md">
        <SelectGroup
          v-model="collectionFilterValue"
          label="Collection"
          :showLabel="false"
          class="w-56"
          :disabled="isLoading"
          :selectClass="{
            'border-primary border-2 bg-primary-muted':
              collectionFilterId !== null,
          }"
          :options="collectionFilterOptions" />
        <Button
          v-if="hasActiveFilters"
          variant="tertiary"
          class="whitespace-nowrap"
          @click="clearFilters">
          Reset
        </Button>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <InputGroup
          :modelValue="searchText"
          label="Search Permissions"
          placeholder="Search permissions"
          :labelHidden="true"
          class="max-w-sm"
          type="search"
          :disabled="isLoading"
          @update:modelValue="searchPermissions"></InputGroup>
        <Button
          variant="primary"
          class="whitespace-nowrap"
          @click="openAddPermission()">
          Add Permission
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
              <TableCell v-for="(_, index) in permissionColumns" :key="index">
                <Skeleton height="1rem" width="70%" />
              </TableCell>
            </TableRow>
          </template>
          <template v-else>
            <template v-for="row in table.getRowModel().rows" :key="row.id">
              <TableRow
                :data-permission-row="row.original.key"
                tabindex="-1"
                :aria-current="
                  isCurrentRow(row.original.key) ? 'true' : undefined
                "
                :class="{
                  'border-b-transparent': row.getIsExpanded(),
                  'permission-row--current': isCurrentRow(row.original.key),
                  'opacity-50 pointer-events-none':
                    row.original.key === deletingKey ||
                    row.original.group.id === deletingGroupId,
                }">
                <TableCell
                  v-for="cell in row.getVisibleCells()"
                  :key="cell.id"
                  :class="{ 'align-top': editingKey === row.original.key }">
                  <FlexRender
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()" />
                </TableCell>
              </TableRow>
              <TableRow
                v-if="row.getIsExpanded()"
                :class="{
                  'permission-row--current': isCurrentRow(row.original.key),
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
                :colspan="permissionColumns.length"
                class="h-16 text-center text-sm"
                :class="isError ? 'text-error' : 'text-on-surface-variant'">
                {{ emptyMessage }}
              </TableCell>
            </TableRow>

            <AddPermissionRow
              v-model:open="isAddingPermission"
              :prefillGroup="prefillGroup"
              :prefillCollectionId="collectionFilterId"
              :colspan="permissionColumns.length"
              @created="revealSavedPermission" />
            <AddRowButton
              v-if="!isAddingPermission"
              :colspan="permissionColumns.length"
              label="Add Permission"
              @click="openAddPermission()" />
          </template>
        </TableBody>
      </Table>
    </div>

    <section
      v-if="
        !isLoading && unassignedGroupRows.length && collectionFilterId === null
      "
      class="mt-8">
      <h2 class="text-base font-medium text-on-surface">Unassigned Groups</h2>
      <p class="mt-1 text-sm text-on-surface-variant">
        Groups that hold no permissions yet.
      </p>
      <UnassignedGroupsTable
        class="mt-4"
        :rows="unassignedGroupRows"
        :searchText="searchText"
        :deletingGroupId="deletingGroupId"
        @addPermission="openAddPermission"
        @deleteGroup="askToDeleteGroup" />
    </section>

    <p class="mt-2 text-xs text-on-surface-variant">
      Global groups (All, Authenticated Users) apply to everyone and have no
      members to manage.
    </p>

    <ConfirmModal
      :isOpen="Boolean(rowPendingRemove)"
      title="Remove Permission"
      type="danger"
      confirmLabel="Remove"
      @close="rowPendingRemove = null"
      @confirm="confirmRemovePermission">
      <p>
        Are you sure you want to remove the
        <b>{{ rowPendingRemove?.permissionLabel }}</b>
        permission that
        <b>{{ rowPendingRemove?.groupLabel }}</b>
        holds on
        <b>{{ rowPendingRemove?.collectionLabel }}?</b>
        This action cannot be undone.
      </p>
    </ConfirmModal>

    <ConfirmModal
      :isOpen="Boolean(groupPendingDelete)"
      title="Delete Group"
      type="danger"
      confirmLabel="Delete"
      @close="groupPendingDelete = null"
      @confirm="confirmDeleteGroup">
      <p>
        Are you sure you want to delete
        <b>{{ groupPendingDeleteLabel }}?</b>
        Every permission it holds, on the instance and on any collection, goes
        with it. This action cannot be undone.
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
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-vue-next";
import Button from "@/components/Button/Button.vue";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import Skeleton from "@/components/Skeleton/Skeleton.vue";
import { buildPermissionOptions } from "@/components/PermissionSelect/buildPermissionOptions";
import { tryFocus } from "@/helpers/tryFocus";
import {
  flattenCollections,
  normalizeAssetCollections,
} from "@/helpers/collectionHelpers";
import { useInstanceQuery } from "@/queries/useInstanceQuery";
import { permissionLevelsQuery } from "@/queries/permissionLevelsQuery";
import { useToastStore } from "@/stores/toastStore";
import AddPermissionRow from "./AddPermissionRow.vue";
import type { CreatedPermission } from "./AddPermissionRow.vue";
import AddRowButton from "./AddRowButton.vue";
import GroupEntriesManager from "./GroupEntriesManager.vue";
import GroupMemberManager from "./GroupMemberManager.vue";
import UnassignedGroupsTable from "./UnassignedGroupsTable.vue";
import {
  buildPermissionsPageRows,
  permissionRowKey,
} from "./buildPermissionsPageRows";
import type { PermissionRow } from "./buildPermissionsPageRows";
import { createPermissionColumns } from "./PermissionsTableColumns";
import { useCollectionFilter } from "./useCollectionFilter";
import type { SavingRow } from "./PermissionsTableColumns";
import {
  collectionGrantsQuery,
  instanceGrantsQuery,
  useDeleteRuleMutation,
  useSaveRuleMutation,
} from "./ruleQueries";
import {
  groupsQuery,
  groupTypesQuery,
  useDeleteGroupMutation,
  useUpdateGroupMutation,
} from "./groupQueries";
import { GROUP_TYPES, isManageableGroup } from "@/types";
import type { PermissionsGroup } from "@/types";

const SKELETON_ROW_COUNT = 3;

const toastStore = useToastStore();

const {
  data: instanceGrants,
  isLoading: isLoadingInstanceGrants,
  isError: isInstanceGrantsError,
} = useQuery(instanceGrantsQuery());
const {
  data: collectionGrants,
  isLoading: isLoadingCollectionGrants,
  isError: isCollectionGrantsError,
} = useQuery(collectionGrantsQuery());
const {
  data: groups,
  isLoading: isLoadingGroups,
  isError: isGroupsError,
} = useQuery(groupsQuery());
const {
  data: groupTypes,
  isLoading: isLoadingTypes,
  isError: isTypesError,
} = useQuery(groupTypesQuery());
const {
  data: permissionLevels,
  isLoading: isLoadingLevels,
  isError: isLevelsError,
} = useQuery(permissionLevelsQuery());
const { data: instanceNav, isLoading: isLoadingNav } = useInstanceQuery();

// rows join every source, so any one still loading means no rows yet
const isLoading = computed(
  () =>
    isLoadingInstanceGrants.value ||
    isLoadingCollectionGrants.value ||
    isLoadingGroups.value ||
    isLoadingTypes.value ||
    isLoadingLevels.value ||
    isLoadingNav.value
);

// each source falls back to [], so one failing looks identical to no rows
const isError = computed(
  () =>
    isInstanceGrantsError.value ||
    isCollectionGrantsError.value ||
    isGroupsError.value ||
    isTypesError.value ||
    isLevelsError.value
);

const flatCollections = computed(() =>
  flattenCollections(
    normalizeAssetCollections(instanceNav.value?.collections ?? [])
  )
);

const collectionTitleById = computed(
  () =>
    new Map(
      flatCollections.value.map((collection) => [
        collection.id,
        collection.title,
      ])
    )
);

// shared with the page header, which titles itself after the filter
const { collectionFilterId } = useCollectionFilter();

const ALL_COLLECTIONS_FILTER = 0;

const collectionFilterValue = computed<number>({
  get: () => collectionFilterId.value ?? ALL_COLLECTIONS_FILTER,
  set(value) {
    collectionFilterId.value = value === ALL_COLLECTIONS_FILTER ? null : value;
  },
});

const collectionFilterOptions = computed(() => [
  { id: ALL_COLLECTIONS_FILTER, label: "All Collections" },
  ...flatCollections.value.map((collection) => ({
    id: collection.id,
    label: collection.title,
  })),
]);

const pageRows = computed(() =>
  buildPermissionsPageRows({
    instanceGrants: instanceGrants.value ?? [],
    collectionGrants: collectionGrants.value ?? [],
    groups: groups.value ?? [],
    permissionLevels: permissionLevels.value ?? [],
    groupTypes: groupTypes.value ?? [],
    collectionTitleById: collectionTitleById.value,
  })
);

const permissionRows = computed(() => pageRows.value.permissionRows);
const unassignedGroupRows = computed(() => pageRows.value.unassignedGroupRows);

const hasActiveFilters = computed(
  (): boolean => collectionFilterId.value !== null || searchText.value !== ""
);

function clearFilters(): void {
  searchText.value = "";
  currentRowKey.value = null;
  collectionFilterId.value = null;
}

const visiblePermissionRows = computed((): PermissionRow[] => {
  const collectionId = collectionFilterId.value;
  if (collectionId === null) return permissionRows.value;
  return permissionRows.value.filter(
    (row) => row.collectionId === collectionId
  );
});

const emptyMessage = computed((): string => {
  if (isError.value) return "Could not load permissions.";
  // the table renders this only when no row is visible, so rows that
  // exist are rows the search hid
  if (visiblePermissionRows.value.length > 0) {
    return "No permissions match your search.";
  }
  if (collectionFilterId.value !== null) {
    return "No permissions for this collection yet. Add one to get started.";
  }
  return "No permissions yet. Add one to get started.";
});

// the inline add form, seeded with a group when a row's Add Permission
// action opened it
const isAddingPermission = ref(false);
const prefillGroup = ref<PermissionsGroup | null>(null);

function openAddPermission(group: PermissionsGroup | null = null): void {
  prefillGroup.value = group;
  isAddingPermission.value = true;

  // focus the form's first field after next render
  tryFocus("[data-add-permission-form] select").catch((error) =>
    console.warn("Could not focus the add permission form", error)
  );
}

// only one row edits at a time, so one set of drafts covers the table
const editingKey = ref<string | null>(null);
const draftLabel = ref("");
const draftLevelId = ref<number | null>(null);
const saveRule = useSaveRuleMutation();
const updateGroup = useUpdateGroupMutation();
const deleteRule = useDeleteRuleMutation();

const permissionOptions = computed(() =>
  buildPermissionOptions(permissionLevels.value ?? [])
);

function toLevelLabel(levelId: number | null): string {
  const option = permissionOptions.value.find(
    (candidate) => candidate.id === levelId
  );
  return option?.label ?? "";
}

function startEdit(row: PermissionRow) {
  editingKey.value = row.key;
  draftLabel.value = row.group.label;
  draftLevelId.value = row.permissionLevelId;
}

function cancelEdit() {
  editingKey.value = null;
  draftLabel.value = "";
  draftLevelId.value = null;
}

// What a group is called and what it can reach are separate resources,
// so one Save can send one request, the other, or both.
function saveEdit(row: PermissionRow) {
  const label = draftLabel.value.trim();
  const levelId = draftLevelId.value;
  cancelEdit();

  // levelLabel drives the pending chip, so it stays empty unless the
  // level is what changed.
  const isLevelChanged = levelId !== null && levelId !== row.permissionLevelId;

  submittedRow.value = {
    key: row.key,
    groupLabel: label || row.groupLabel,
    levelLabel: isLevelChanged ? toLevelLabel(levelId) : "",
  };

  saveGroupName(row, label);
  if (levelId !== null) {
    saveLevel(row, levelId);
  }
}

function saveGroupName(row: PermissionRow, label: string) {
  if (!label) return;
  if (label === row.group.label) return;

  // a group's type is fixed at creation, so the update resends it as is
  updateGroup.mutate({
    id: row.group.id,
    payload: { label, type: row.group.type },
  });
}

function saveLevel(row: PermissionRow, levelId: number) {
  if (levelId === row.permissionLevelId) return;

  saveRule.mutate({
    kind: "update",
    grantId: row.grantId,
    rule: {
      collectionId: row.collectionId,
      groupId: row.group.id,
      permissionLevelId: levelId,
    },
  });
}

// What the row that was saved submitted, which its cells show while the
// lists still hold the values it replaced.
const submittedRow = ref<SavingRow | null>(null);

// One Save can fire a group request and a level request, and either can
// be the one still running.
const isSaveInFlight = computed(
  (): boolean => updateGroup.isPending.value || saveRule.isPending.value
);

const savingRow = computed((): SavingRow | null =>
  isSaveInFlight.value ? submittedRow.value : null
);

// the permission awaiting removal confirmation, doubling as the modal's
// open state
const rowPendingRemove = ref<PermissionRow | null>(null);

function askToRemovePermission(row: PermissionRow) {
  rowPendingRemove.value = row;
}

function confirmRemovePermission() {
  const row = rowPendingRemove.value;
  rowPendingRemove.value = null;
  if (!row) return;

  deleteRule.mutate(
    { scope: row.scope, grantId: row.grantId },
    {
      onSuccess: () =>
        toastStore.success(`Permission removed from "${row.groupLabel}".`),
      onError: (error) =>
        toastStore.error(
          `Failed to remove permission from "${row.groupLabel}": ${error.message}`,
          { title: "Remove Permission Failed" }
        ),
    }
  );
}

// The row being removed grays out until the refetch drops it. isPending
// holds through the refetch because onSettled returns its promise.
const deletingKey = computed((): string | null => {
  const vars = deleteRule.variables.value;
  if (!deleteRule.isPending.value || !vars) return null;
  return permissionRowKey(vars.scope, vars.grantId);
});

// the group awaiting delete confirmation, doubling as the modal's open state
const groupPendingDelete = ref<PermissionsGroup | null>(null);
const deleteGroup = useDeleteGroupMutation();

const groupPendingDeleteLabel = computed((): string => {
  const group = groupPendingDelete.value;
  if (!group) return "";
  return group.label || group.type;
});

function askToDeleteGroup(group: PermissionsGroup) {
  groupPendingDelete.value = group;
}

function confirmDeleteGroup() {
  const group = groupPendingDelete.value;
  const label = groupPendingDeleteLabel.value;
  groupPendingDelete.value = null;
  if (!group) return;

  deleteGroup.mutate(group.id, {
    onSuccess: () => toastStore.success(`Group "${label}" deleted.`),
    onError: (error) =>
      toastStore.error(`Failed to delete group "${label}": ${error.message}`, {
        title: "Delete Group Failed",
      }),
  });
}

// the group being deleted, whose rows gray out until the refetch drops them
const deletingGroupId = computed((): number | null => {
  if (!deleteGroup.isPending.value) return null;
  return deleteGroup.variables.value ?? null;
});

const permissionColumns = createPermissionColumns({
  editingKey,
  draftLabel,
  draftLevelId,
  savingRow,
  permissionOptions,
  onEdit: startEdit,
  onCancel: cancelEdit,
  onSave: saveEdit,
  onRemovePermission: askToRemovePermission,
  onDeleteGroup: (row) => askToDeleteGroup(row.group),
});

// The rows arrive ordered by the builder (instance-wide first, then by
// collection), so the table sorts by nothing until a header says
// otherwise.
const sorting = ref<SortingState>([]);

// One search box filters both tables across every text column.
const searchText = ref("");

// keys of the currently expanded rows, so each group fetches its members
// or entries only when a detail panel is open
const expanded = ref<ExpandedState>({});

// the row the user just saved. Sorting, searching, or expanding means
// the user has moved on, so those handlers clear it.
const currentRowKey = ref<string | null>(null);

// Typing in the search box means the user moved on from the row they
// just saved. revealSavedPermission writes searchText directly, since it
// clears the box to show that row rather than to leave it.
function searchPermissions(text: string): void {
  searchText.value = text;
  currentRowKey.value = null;
}

function isCurrentRow(key: string): boolean {
  return key === currentRowKey.value;
}

const table = useVueTable({
  get data() {
    return visiblePermissionRows.value;
  },
  columns: permissionColumns as ColumnDef<PermissionRow, unknown>[],
  getRowId: (row) => row.key,
  getRowCanExpand: (row) => isManageableGroup(row.original.group),
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  globalFilterFn: "includesString",
  onSortingChange: (updater) => {
    currentRowKey.value = null;
    sorting.value = functionalUpdate(updater, sorting.value);
  },
  onExpandedChange: (updater) => {
    currentRowKey.value = null;
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
function expandRow(key: string): void {
  const currentlyExpanded = expanded.value === true ? {} : expanded.value;
  expanded.value = { ...currentlyExpanded, [key]: true };
}

// A new group holds nobody and reaches nothing, so its row opens on the
// members it needs. An existing group's new permission just gets shown.
async function revealSavedPermission({
  group,
  rowKey,
  isNewGroup,
}: CreatedPermission): Promise<void> {
  // an active search could hide the row, so clear the search
  searchText.value = "";
  currentRowKey.value = rowKey;

  if (!isNewGroup || !isManageableGroup(group)) {
    await focusRevealedRow(`[data-permission-row="${rowKey}"]`);
    return;
  }

  expandRow(rowKey);
  const addControlSelector =
    group.type === GROUP_TYPES.USER
      ? `[data-group-add-member="${group.id}"]`
      : `[data-group-entry-add-button="${group.id}"]`;

  const addControl = await focusRevealedRow(addControlSelector);
  // clicking the add control opens its form, which then moves focus into
  // the field the user came here to fill
  addControl?.click();
}

// The row, its detail panel, and the control inside it mount across
// several frames, so tryFocus retries until focus lands rather than
// guessing a single tick.
async function focusRevealedRow(selector: string): Promise<HTMLElement | null> {
  try {
    const focused = await tryFocus(selector);
    focused.scrollIntoView({ block: "nearest" });
    return focused;
  } catch (error) {
    console.warn("Could not focus the saved permission's row", error);
    return null;
  }
}
</script>
<style scoped>
.permission-row--current {
  animation: current-row-flash 0.5s ease-out;
}

@keyframes current-row-flash {
  from {
    background-color: var(--primary-muted);
  }
  to {
    background-color: transparent;
  }
}
</style>
