<template>
  <div class="flex flex-col gap-4">
    <div>
      <label :for="`group-${group.id}-add-member`" class="sr-only">
        Add member
      </label>
      <AutoCompleteInput
        :id="`group-${group.id}-add-member`"
        v-model="search"
        :items="matchList"
        :isLoading="isSearching"
        :isItemDisabled="(match: UserAutocompleteMatch) => !isAddable(match)"
        :blurOnSelect="false"
        placeholder="Add member by name or email…"
        inputClass="mt-1 w-full bg-surface-container rounded-md px-3 py-2 text-sm"
        @select="add">
        <template #option="{ item }">
          <span>{{ item.name }}</span>
          <span class="text-inverse-on-surface/70">{{ item.email }}</span>
          <span
            v-if="reasonNotAddable(item)"
            class="ml-auto text-xs italic text-inverse-on-surface/70">
            {{ reasonNotAddable(item) }}
          </span>
        </template>
      </AutoCompleteInput>
    </div>
    <GroupMembersTable :columns="columns" :data="memberList" class="mb-2" />

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
import { useDebounce } from "@vueuse/core";
import { AutoCompleteInput } from "@/components/AutoCompleteInput";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal.vue";
import GroupMembersTable from "./GroupMembersTable.vue";
import { createGroupMemberColumns } from "./GroupMembersTableColumns";
import { useUserAutocompleteQuery } from "@/queries/useUserAutocompleteQuery";
import { useGroupMembersQuery } from "@/queries/useGroupMembersQuery";
import { useAddGroupMemberMutation } from "@/queries/useAddGroupMemberMutation";
import { useRemoveGroupMemberMutation } from "@/queries/useRemoveGroupMemberMutation";
import type {
  GroupMember,
  PermissionsGroup,
  UserAutocompleteMatch,
} from "@/types";

const props = defineProps<{
  group: PermissionsGroup;
  isOpen: boolean;
}>();

const { data: members } = useGroupMembersQuery(() => props.group.id, {
  enabled: () => props.isOpen,
});
const memberList = computed(() => members.value ?? []);

const search = ref("");
const debouncedSearch = useDebounce(search, 300);
const { data: matches, isFetching: isSearching } =
  useUserAutocompleteQuery(debouncedSearch);
const matchList = computed(() => matches.value ?? []);

const addMutation = useAddGroupMemberMutation();
const removeMutation = useRemoveGroupMemberMutation();

const memberToRemove = ref<GroupMember | null>(null);

function remove(member: GroupMember) {
  memberToRemove.value = member;
}

function confirmRemove() {
  if (memberToRemove.value) {
    removeMutation.mutate({
      groupId: props.group.id,
      userId: memberToRemove.value.userId,
    });
  }
}

const columns = createGroupMemberColumns(remove);

const memberIds = computed(
  () => new Set(memberList.value.map((member) => member.userId))
);

function isAlreadyMember(match: UserAutocompleteMatch): boolean {
  return match.localUserId !== null && memberIds.value.has(match.localUserId);
}

function isAddable(match: UserAutocompleteMatch): boolean {
  return match.localUserId !== null && !isAlreadyMember(match);
}

function reasonNotAddable(match: UserAutocompleteMatch): string | null {
  if (match.localUserId === null) return "not in the system yet";
  if (isAlreadyMember(match)) return "already a member";
  return null;
}

function add(match: UserAutocompleteMatch) {
  if (match.localUserId === null) return;
  addMutation.mutate({ groupId: props.group.id, userId: match.localUserId });
  search.value = "";
}
</script>
