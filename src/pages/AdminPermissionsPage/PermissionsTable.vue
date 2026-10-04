<template>
  <div>
    <DataTable
      ref="table"
      class="[&_table]:min-w-[52rem]"
      :itemName="{ singular: 'permission', plural: 'permissions' }"
      :rows="rowsInCollectionFilter"
      :columns="permissionColumns"
      :status="tableStatus"
      :isFiltered="collectionFilterId !== null"
      :canExpand="(row) => isManageableGroup(row.group)"
      :rowName="(row) => row.groupLabel"
      :isRowDeleting="isPermissionRowDeleting">
      <template #toolbarStart>
        <div
          aria-label="Permission filters"
          :class="[
            'flex min-w-0 items-center gap-2 rounded-md',
            {
              'bg-primary-muted px-2 py-1': collectionFilterId !== null,
            },
          ]">
          <FilterIcon
            v-if="collectionFilterId !== null"
            class="h-4 w-4 shrink-0 text-primary" />
          <SelectGroup
            v-model="collectionFilterValue"
            class="min-w-0"
            label="Collection"
            :showLabel="false"
            :disabled="isLoading"
            :selectClass="{
              'border-primary bg-transparent text-on-surface':
                collectionFilterId !== null,
            }"
            :options="collectionFilterOptions" />
          <Button
            v-if="collectionFilterId !== null"
            variant="tertiary"
            class="whitespace-nowrap"
            @click="collectionFilterId = null">
            Reset
          </Button>
        </div>
      </template>
      <template #toolbarEnd>
        <Button variant="primary" @click="openAddPermission()">
          Create Permission
        </Button>
      </template>
      <template #cell-scope="{ row }">
        <Chip
          class="border border-outline-variant"
          :class="
            row.scope === 'instance'
              ? 'bg-secondary-container text-on-secondary-container'
              : 'bg-tertiary-container text-on-tertiary-container'
          ">
          {{ row.scope === "instance" ? "Instance" : "Collection" }}
        </Chip>
      </template>
      <template #cell-collection="{ row }">
        <RouterLink
          v-if="row.collectionId !== null"
          :to="`/collections/browseCollection/${row.collectionId}`"
          class="text-sm font-medium text-primary underline-offset-2 hover:underline">
          {{ row.collectionLabel }}
        </RouterLink>
        <div v-else class="text-sm text-on-surface font-medium italic">*</div>
      </template>
      <template #cell-group="{ row }">
        <GroupNameWithSummary
          :name="row.groupLabel"
          :summary="toGroupSummary(row.group, row.typeLabel)" />
      </template>
      <template #cell-permission="{ row }">
        <span
          v-if="row.permissionLevelNumber === 0"
          class="text-sm text-on-surface-muted">
          {{ row.permissionLabel }}
        </span>
        <PermissionChip
          v-else
          :levelNumber="row.permissionLevelNumber"
          :label="row.permissionLabel" />
      </template>
      <template #cell-actions="{ row }">
        <div class="flex justify-end">
          <KebabMenu
            :label="`More options for ${row.groupLabel}`"
            :items="permissionMenuItems(row)" />
        </div>
      </template>
      <template #detail="{ row }">
        <GroupMemberManager
          v-if="row.group.type === GROUP_TYPES.USER"
          :group="row.group"
          class="bg-surface-container" />
        <GroupEntriesManager
          v-else
          :group="row.group"
          class="bg-surface-container" />
      </template>
    </DataTable>

    <section v-if="isSuccess" class="mt-12">
      <GroupsTable
        :rows="groupRows"
        :deletingGroupId="deletingGroupId"
        @addPermission="openAddPermission"
        @deleteGroup="askToDeleteGroup" />
    </section>

    <p class="mt-2 text-xs text-on-surface-variant">
      Global groups (All, Authenticated Users) apply to everyone and have no
      members to manage.
    </p>

    <AddPermissionDialog
      v-model:open="isAddingPermission"
      :prefillGroup="prefillGroup"
      :prefillCollectionId="collectionFilterId"
      @created="revealSavedPermission" />

    <EditPermissionDialog
      v-model:open="isEditingPermission"
      :row="permissionToEdit" />

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
import type { QueryStatus } from "@tanstack/vue-query";
import {
  CircleMinusIcon,
  FilterIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-vue-next";
import { DataTable } from "@/components/DataTable";
import Button from "@/components/Button/Button.vue";
import Chip from "@/components/Chip/Chip.vue";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal.vue";
import KebabMenu from "@/components/KebabMenu/KebabMenu.vue";
import type { KebabMenuItem } from "@/components/KebabMenu/KebabMenu.vue";
import PermissionChip from "@/components/PermissionChip/PermissionChip.vue";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import {
  flattenCollections,
  normalizeAssetCollections,
} from "@/helpers/collectionHelpers";
import { useInstanceNavQuery } from "@/queries/useInstanceNavQuery";
import { permissionLevelsQuery } from "@/queries/permissionLevelsQuery";
import { useToastStore } from "@/stores/toastStore";
import AddPermissionDialog from "./AddPermissionDialog.vue";
import type { CreatedPermission } from "./AddPermissionDialog.vue";
import EditPermissionDialog from "./EditPermissionDialog.vue";
import GroupEntriesManager from "./GroupEntriesManager.vue";
import GroupMemberManager from "./GroupMemberManager.vue";
import GroupsTable from "./GroupsTable.vue";
import { openGroupAddRow } from "./openGroupAddRow";
import {
  buildPermissionsPageRows,
  permissionRowId,
} from "./buildPermissionsPageRows";
import type { PermissionRow } from "./buildPermissionsPageRows";
import { useCollectionFilter } from "./useCollectionFilter";
import {
  collectionGrantsQuery,
  instanceGrantsQuery,
  useDeleteRuleMutation,
} from "./ruleQueries";
import {
  groupsQuery,
  groupTypesQuery,
  useDeleteGroupMutation,
} from "./groupQueries";
import GroupNameWithSummary from "../DrawerManagementPage/GroupNameWithSummary.vue";
import { toGroupSummary } from "../DrawerManagementPage/toGroupSummary";
import { GROUP_TYPES, isManageableGroup } from "@/types";
import type {
  DataTableColumn,
  DataTableHandle,
  PermissionsGroup,
} from "@/types";

const toastStore = useToastStore();

const instanceGrantsResult = useQuery(instanceGrantsQuery());
const collectionGrantsResult = useQuery(collectionGrantsQuery());
const groupsResult = useQuery(groupsQuery());
const groupTypesResult = useQuery(groupTypesQuery());
const permissionLevelsResult = useQuery(permissionLevelsQuery());
const instanceNavResult = useInstanceNavQuery();

// the one list every table-wide state derives from, so a query added here
// cannot reach isLoading while missing from isSuccess
const tableQueries = [
  instanceGrantsResult,
  collectionGrantsResult,
  groupsResult,
  groupTypesResult,
  permissionLevelsResult,
  instanceNavResult,
];

const { data: instanceGrants } = instanceGrantsResult;
const { data: collectionGrants } = collectionGrantsResult;
const { data: groups } = groupsResult;
const { data: groupTypes } = groupTypesResult;
const { data: permissionLevels } = permissionLevelsResult;
const { data: instanceNav } = instanceNavResult;

// rows join every source, so any one still loading means no rows yet
const isLoading = computed(() =>
  tableQueries.some((query) => query.isLoading.value)
);

// `success` is the only status that guarantees data, so the rows branch
// asks for it positively. Every other state, including an offline pause
// that leaves isLoading and isError both false, falls through to the
// error branch.
const isSuccess = computed(() =>
  tableQueries.every((query) => query.isSuccess.value)
);

const tableStatus = computed((): QueryStatus => {
  if (isLoading.value) return "pending";
  return isSuccess.value ? "success" : "error";
});

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
const groupRows = computed(() => pageRows.value.groupRows);

const rowsInCollectionFilter = computed((): PermissionRow[] => {
  const collectionId = collectionFilterId.value;
  if (collectionId === null) return permissionRows.value;
  return permissionRows.value.filter(
    (row) => row.collectionId === collectionId
  );
});

function isHiddenByCollectionFilter(rowId: string): boolean {
  const isListedIn = (rows: PermissionRow[]) =>
    rows.some((row) => row.id === rowId);
  return (
    isListedIn(permissionRows.value) &&
    !isListedIn(rowsInCollectionFilter.value)
  );
}

const table = ref<DataTableHandle | null>(null);

const isAddingPermission = ref(false);
const prefillGroup = ref<PermissionsGroup | null>(null);

function openAddPermission(group: PermissionsGroup | null = null): void {
  prefillGroup.value = group;
  isAddingPermission.value = true;
}

const isEditingPermission = ref(false);
const permissionToEdit = ref<PermissionRow | null>(null);

function openEditPermission(row: PermissionRow): void {
  permissionToEdit.value = row;
  isEditingPermission.value = true;
}

// the permission awaiting removal confirmation, doubling as the modal's
// open state
const rowPendingRemove = ref<PermissionRow | null>(null);
const deleteRule = useDeleteRuleMutation();

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
const deletingRowId = computed((): string | null => {
  const vars = deleteRule.variables.value;
  if (!deleteRule.isPending.value || !vars) return null;
  return permissionRowId(vars.scope, vars.grantId);
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

function isPermissionRowDeleting(row: PermissionRow): boolean {
  return (
    row.id === deletingRowId.value || row.group.id === deletingGroupId.value
  );
}

function permissionMenuItems(row: PermissionRow): KebabMenuItem[] {
  return [
    {
      label: "Edit Group",
      icon: PencilIcon,
      onSelect: () => openEditPermission(row),
    },
    {
      label: "Remove Permission",
      icon: CircleMinusIcon,
      onSelect: () => askToRemovePermission(row),
    },
    {
      label: "Delete Group",
      icon: TrashIcon,
      variant: "danger",
      onSelect: () => askToDeleteGroup(row.group),
    },
  ];
}

const permissionColumns: DataTableColumn<PermissionRow>[] = [
  {
    id: "scope",
    label: "Scope",
    width: "md",
    sortValue: (row) => row.scope,
    searchValue: (row) => row.scope,
  },
  {
    id: "collection",
    label: "Collection",
    width: "lg",
    sortValue: (row) => (row.collectionId === null ? "*" : row.collectionLabel),
    searchValue: (row) => row.collectionLabel,
  },
  {
    id: "group",
    label: "Group",
    sortValue: (row) => row.groupLabel,
    searchValue: (row) => [row.groupLabel, row.typeLabel],
  },
  {
    id: "permission",
    label: "Permission",
    width: "lg",
    sortValue: (row) => row.permissionLabel,
    searchValue: (row) => row.permissionLabel,
  },
  { id: "actions", label: "Actions", isLabelHidden: true, width: "sm" },
];

async function revealSavedPermission({
  group,
  rowId,
  isNewGroup,
}: CreatedPermission): Promise<void> {
  if (isHiddenByCollectionFilter(rowId)) collectionFilterId.value = null;

  const shouldExpandNewGroup = isNewGroup && isManageableGroup(group);
  await table.value?.reveal(rowId, { expand: shouldExpandNewGroup });
  if (shouldExpandNewGroup) await openGroupAddRow(group);
}
</script>
