<template>
  <div>
    <p class="mb-4 text-sm">
      Share a drawer by assigning permissions to an existing drawer group or
      creating a new one.
    </p>

    <DataTable
      ref="table"
      :itemName="{ singular: 'group', plural: 'groups' }"
      :rows="groupRows"
      :columns="groupAccessColumns"
      :status="tableStatus"
      :canExpand="(row) => canOpenGroup(row.group)"
      :rowName="(row) => row.groupLabel"
      :isRowDeleting="(row) => row.id === deletingGroupId">
      <template #toolbarEnd>
        <Button variant="primary" @click="isCreatingGroup = true">
          Create Group
        </Button>
      </template>
      <template #cell-group="{ row }">
        <GroupNameWithSummary
          :name="row.groupLabel"
          :summary="toGroupSummary(row.group, row.typeLabel)"
          :ownerName="otherOwnerNameOf(row)" />
      </template>
      <template #cell-permission="{ row }">
        <PermissionChip
          v-if="row.id === removingPermissionsRowId"
          :label="noAccessLabel"
          isPending />
        <span
          v-else-if="row.permissionLevelNumber === 0"
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
            :items="groupMenuItems(row)" />
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

    <CreateDrawerGroupDialog
      v-model:open="isCreatingGroup"
      :drawerId="drawerId"
      @created="revealNewGroup" />

    <EditGroupAccessDialog
      v-model:open="isEditingGroup"
      :drawerId="drawerId"
      :row="groupToEdit" />

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
import type { QueryStatus } from "@tanstack/vue-query";
import { CircleMinusIcon, PencilIcon, TrashIcon } from "lucide-vue-next";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal.vue";
import KebabMenu from "@/components/KebabMenu/KebabMenu.vue";
import type { KebabMenuItem } from "@/components/KebabMenu/KebabMenu.vue";
import PermissionChip from "@/components/PermissionChip/PermissionChip.vue";
import Button from "@/components/Button/Button.vue";
import { DataTable } from "@/components/DataTable";
import CreateDrawerGroupDialog from "./CreateDrawerGroupDialog.vue";
import EditGroupAccessDialog from "./EditGroupAccessDialog.vue";
import GroupNameWithSummary from "./GroupNameWithSummary.vue";
import GroupEntriesManager from "./GroupEntriesManager.vue";
import GroupMemberManager from "./GroupMemberManager.vue";
import { buildGroupAccessRows } from "./buildGroupAccessRows";
import type { GroupAccessRow } from "./buildGroupAccessRows";
import {
  drawerGrantsQuery,
  useDeleteDrawerGrantMutation,
  useUpdateDrawerGrantMutation,
} from "./drawerGrantQueries";
import {
  drawerGroupsQuery,
  drawerGroupTypesQuery,
  useDeleteDrawerGroupMutation,
} from "./drawerGroupQueries";
import { toGroupSummary } from "./toGroupSummary";
import { toNoAccessLevelId } from "./toNoAccessLevelId";
import { openGroupAddRow } from "../AdminPermissionsPage/openGroupAddRow";
import { permissionLevelsQuery } from "@/queries/permissionLevelsQuery";
import { useToastStore } from "@/stores/toastStore";
import { GROUP_TYPES, isManageableGroup } from "@/types";
import type {
  DataTableColumn,
  DataTableHandle,
  DrawerGrantGroup,
  PermissionsGroup,
} from "@/types";

const props = defineProps<{ drawerId: number }>();

const toastStore = useToastStore();

const grantsResult = useQuery(drawerGrantsQuery());
const groupsResult = useQuery(drawerGroupsQuery());
const groupTypesResult = useQuery(drawerGroupTypesQuery());
const permissionLevelsResult = useQuery(permissionLevelsQuery());

// the one list every table-wide state derives from, so a query added here
// cannot reach isLoading while missing from isSuccess
const tableQueries = [
  grantsResult,
  groupsResult,
  groupTypesResult,
  permissionLevelsResult,
];

const { data: grants } = grantsResult;
const { data: groups } = groupsResult;
const { data: groupTypes } = groupTypesResult;
const { data: permissionLevels } = permissionLevelsResult;

// rows join all four sources, so any one still loading means no rows yet
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

const groupRows = computed(() =>
  buildGroupAccessRows({
    grants: grants.value ?? [],
    ownGroups: groups.value ?? [],
    drawerId: props.drawerId,
    permissionLevels: permissionLevels.value ?? [],
    groupTypes: groupTypes.value ?? [],
  })
);

// A group holds members or entries to manage, and the API answers for
// those only when the caller owns the group.
// TODO: drop the ownedByCurrentUser check once the API scopes group
// reads and writes to the drawers the caller manages.
function canOpenGroup(group: DrawerGrantGroup): boolean {
  return isManageableGroup(group) && group.ownedByCurrentUser;
}

function otherOwnerNameOf(row: GroupAccessRow): string | null {
  if (row.group.ownedByCurrentUser) return null;
  return row.group.ownerName || null;
}

const table = ref<DataTableHandle | null>(null);
const isCreatingGroup = ref(false);
const isEditingGroup = ref(false);
const groupToEditId = ref<number | null>(null);

const groupToEdit = computed(
  (): GroupAccessRow | null =>
    groupRows.value.find((row) => row.id === groupToEditId.value) ?? null
);

function openEditGroup(row: GroupAccessRow): void {
  groupToEditId.value = row.id;
  isEditingGroup.value = true;
}

const deleteGrant = useDeleteDrawerGrantMutation();
const updateGrant = useUpdateDrawerGrantMutation();
const permissionsRemovalRowId = ref<number | null>(null);

const removingPermissionsRowId = computed((): number | null => {
  const isRemovingPermissions =
    deleteGrant.isPending.value || updateGrant.isPending.value;
  return isRemovingPermissions ? permissionsRemovalRowId.value : null;
});

const noAccessLabel = computed((): string => {
  const levels = permissionLevels.value ?? [];
  const noAccessLevelId = toNoAccessLevelId(levels);
  return levels.find((level) => level.id === noAccessLevelId)?.label ?? "";
});

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

  const noAccessLevelId = toNoAccessLevelId(permissionLevels.value ?? []);

  const removalToasts = {
    onSuccess: () =>
      toastStore.success(`Permissions removed from "${row.groupLabel}".`),
    onError: (error: Error) =>
      toastStore.error(
        `Failed to remove permissions from "${row.groupLabel}": ${error.message}`,
        { title: "Remove Permissions Failed" }
      ),
  };

  if (row.group.ownedByCurrentUser) {
    permissionsRemovalRowId.value = row.id;
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

  permissionsRemovalRowId.value = row.id;
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

function groupMenuItems(row: GroupAccessRow): KebabMenuItem[] {
  const menuItems: KebabMenuItem[] = [
    {
      label: "Edit Group",
      icon: PencilIcon,
      onSelect: () => openEditGroup(row),
    },
  ];
  if (row.grantId !== null) {
    menuItems.push({
      label: "Remove Permissions",
      icon: CircleMinusIcon,
      onSelect: () => removePermissions(row),
    });
  }
  if (row.group.ownedByCurrentUser) {
    menuItems.push({
      label: "Delete Group",
      icon: TrashIcon,
      variant: "danger",
      onSelect: () => askToDeleteGroup(row),
    });
  }
  return menuItems;
}

const groupAccessColumns: DataTableColumn<GroupAccessRow>[] = [
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

async function revealNewGroup(group: PermissionsGroup): Promise<void> {
  const isManageable = isManageableGroup(group);
  await table.value?.reveal(group.id, { expand: isManageable });
  if (isManageable) await openGroupAddRow(group);
}
</script>
