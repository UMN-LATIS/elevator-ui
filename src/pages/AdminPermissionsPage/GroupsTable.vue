<template>
  <div>
    <DataTable
      ref="table"
      :itemName="{ singular: 'group', plural: 'groups' }"
      :rows="rows"
      :columns="groupColumns"
      :canExpand="(row) => isManageableGroup(row.group)"
      :rowName="(row) => row.groupLabel"
      :isRowDeleting="(row) => row.id === deletingGroupId">
      <template #toolbarStart>
        <div>
          <h2 class="m-0 text-2xl font-bold tracking-tight">Groups</h2>
          <p class="mt-2 text-sm text-on-surface-variant">
            Every group in this instance, and how many permissions it holds.
          </p>
        </div>
      </template>
      <template #toolbarEnd>
        <Button variant="primary" @click="isCreatingGroup = true">
          Create Group
        </Button>
      </template>
      <template #cell-group="{ row }">
        <GroupNameWithSummary
          :name="row.groupLabel"
          :summary="toGroupSummary(row.group, row.typeLabel)" />
      </template>
      <template #cell-permissions="{ row }">
        <span
          v-if="row.permissionCount === 0"
          class="text-sm text-on-surface-variant">
          None
        </span>
        <span v-else class="text-sm tabular-nums">
          {{ row.permissionCount }}
        </span>
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

    <AddGroupDialog v-model:open="isCreatingGroup" @created="revealNewGroup" />
    <RenameGroupDialog v-model:open="isRenamingGroup" :group="groupToRename" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { PencilIcon, PlusIcon, TrashIcon } from "lucide-vue-next";
import Button from "@/components/Button/Button.vue";
import { DataTable } from "@/components/DataTable";
import KebabMenu from "@/components/KebabMenu/KebabMenu.vue";
import type { KebabMenuItem } from "@/components/KebabMenu/KebabMenu.vue";
import GroupNameWithSummary from "../DrawerManagementPage/GroupNameWithSummary.vue";
import { toGroupSummary } from "../DrawerManagementPage/toGroupSummary";
import AddGroupDialog from "./AddGroupDialog.vue";
import GroupEntriesManager from "./GroupEntriesManager.vue";
import GroupMemberManager from "./GroupMemberManager.vue";
import RenameGroupDialog from "./RenameGroupDialog.vue";
import type { GroupRow } from "./buildPermissionsPageRows";
import { openGroupAddRow } from "./openGroupAddRow";
import { GROUP_TYPES, isManageableGroup } from "@/types";
import type {
  DataTableColumn,
  DataTableHandle,
  PermissionsGroup,
} from "@/types";

defineProps<{
  rows: GroupRow[];
  deletingGroupId: number | null;
}>();

const emit = defineEmits<{
  addPermission: [group: PermissionsGroup];
  deleteGroup: [group: PermissionsGroup];
}>();

const table = ref<DataTableHandle | null>(null);
const isCreatingGroup = ref(false);
const isRenamingGroup = ref(false);
const groupToRename = ref<PermissionsGroup | null>(null);

function openRename(group: PermissionsGroup): void {
  groupToRename.value = group;
  isRenamingGroup.value = true;
}

function groupMenuItems(row: GroupRow): KebabMenuItem[] {
  return [
    {
      label: "Edit Group",
      icon: PencilIcon,
      onSelect: () => openRename(row.group),
    },
    {
      label: "Add Permission",
      icon: PlusIcon,
      onSelect: () => emit("addPermission", row.group),
    },
    {
      label: "Delete Group",
      icon: TrashIcon,
      variant: "danger",
      onSelect: () => emit("deleteGroup", row.group),
    },
  ];
}

const groupColumns: DataTableColumn<GroupRow>[] = [
  {
    id: "group",
    label: "Group",
    sortValue: (row) => row.groupLabel,
    searchValue: (row) => [row.groupLabel, row.typeLabel],
  },
  {
    id: "permissions",
    label: "Permissions",
    width: "md",
    sortValue: (row) => row.permissionCount,
  },
  { id: "actions", label: "Actions", isLabelHidden: true, width: "sm" },
];

async function revealNewGroup(group: PermissionsGroup): Promise<void> {
  const isManageable = isManageableGroup(group);
  await table.value?.reveal(group.id, { expand: isManageable });
  if (isManageable) await openGroupAddRow(group);
}
</script>
