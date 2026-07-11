<template>
  <div>
    <GroupMembersTable
      :columns="columns"
      :data="memberList"
      :isLoading="isLoadingMembers"
      :showEmptyMessage="!isAddingMember"
      class="mb-2">
      <AddGroupMemberRow
        v-model:open="isAddingMember"
        :group="group"
        :colspan="columns.length" />
      <AddRowButton
        v-if="!isAddingMember"
        :colspan="columns.length"
        label="Add Member"
        :data-group-add-member="group.id"
        @click="openAddMemberForm" />
    </GroupMembersTable>

    <ConfirmModal
      :isOpen="memberToRemove !== null"
      title="Remove member?"
      type="danger"
      confirmLabel="Remove"
      @confirm="confirmRemove"
      @close="memberToRemove = null">
      <p v-if="memberToRemove">
        Remove
        <strong>{{ memberToRemove.name }}</strong>
        from this group?
      </p>
    </ConfirmModal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal.vue";
import GroupMembersTable from "../AdminPermissionsPage/GroupMembersTable.vue";
import AddGroupMemberRow from "./AddGroupMemberRow.vue";
import AddRowButton from "../AdminPermissionsPage/AddRowButton.vue";
import { createGroupMemberColumns } from "../AdminPermissionsPage/GroupMembersTableColumns";
import { useQuery } from "@tanstack/vue-query";
import {
  drawerGroupMembersQuery,
  useRemoveDrawerGroupMemberMutation,
} from "./drawerGroupQueries";
import { tryFocus } from "@/helpers/tryFocus";
import type { GroupMember, PermissionsGroup } from "@/types";

const props = defineProps<{
  group: PermissionsGroup;
  isOpen: boolean;
}>();

// isPending is true only before the first data arrives. Refetches after
// add/remove keep the old list on screen, so no skeleton flash.
const { data: members, isPending: isLoadingMembers } = useQuery(
  drawerGroupMembersQuery(() => props.group.id, { enabled: () => props.isOpen })
);
const memberList = computed(() => members.value ?? []);

const isAddingMember = ref(false);

function openAddMemberForm(): void {
  isAddingMember.value = true;

  // focus the add form's search field after next render
  tryFocus(() =>
    document.querySelector<HTMLInputElement>(
      `.group-member-add__input--${props.group.id}`
    )
  );
}

const removeMutation = useRemoveDrawerGroupMemberMutation();

// The member being removed shows a "(removing…)" marker until the refetch
// drops the row. isPending holds through the refetch because onSettled
// returns its promise.
const removingUserId = computed((): number | null =>
  removeMutation.isPending.value
    ? removeMutation.variables.value?.userId ?? null
    : null
);

const memberToRemove = ref<GroupMember | null>(null);

function remove(member: GroupMember) {
  memberToRemove.value = member;
}

function confirmRemove() {
  if (!memberToRemove.value) return;
  removeMutation.mutate({
    groupId: props.group.id,
    userId: memberToRemove.value.userId,
  });
  // Close the confirm modal right away. The row stays until the refetch
  // drops it, and a failure surfaces as an error toast.
  memberToRemove.value = null;
}

const columns = createGroupMemberColumns(remove, removingUserId);
</script>
