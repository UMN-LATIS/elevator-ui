<template>
  <div class="flex flex-col gap-4">
    <div :data-group-add-member="group.id">
      <label :for="`group-${group.id}-add-member`" class="sr-only">
        Add member
      </label>
      <AutoCompleteInput
        :id="`group-${group.id}-add-member`"
        v-model="search"
        :items="options"
        :isLoading="isSearching"
        :isItemDisabled="isOptionDisabled"
        :blurOnSelect="false"
        placeholder="Add member by name, email, or username…"
        inputClass="mt-1 w-full bg-surface-container rounded-md px-3 py-2 text-sm"
        @select="add">
        <template #option="{ item }">
          <template v-if="item.kind === 'match'">
            <div
              class="border border-current rounded-full size-8 flex items-center justify-center">
              {{ initials(item.match.name) }}
            </div>
            <div>
              <span class="block truncate font-medium">
                {{ item.match.name }}
              </span>
              <span class="block truncate text-xs">
                {{ secondaryLine(item.match) }}
              </span>
              <em v-if="isAlreadyMember(item.match)" class="text-xs italic">
                already a member
              </em>
            </div>
          </template>
          <template v-else>
            <div
              class="border border-current rounded-md size-8 flex items-center justify-center">
              <PlusIcon class="size-4" />
            </div>
            <div>
              <span class="block truncate font-medium">
                Provision and add remote user
              </span>
              <span class="block truncate text-xs">
                with username: "{{ item.query }}"
              </span>
            </div>
          </template>
        </template>
      </AutoCompleteInput>
    </div>
    <GroupMembersTable
      :columns="columns"
      :data="memberList"
      :isLoading="isLoadingMembers"
      class="mb-2" />

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
import { PlusIcon } from "@/icons";
import { useUserAutocompleteQuery } from "@/queries/useUserAutocompleteQuery";
import { useGroupMembersQuery } from "@/queries/useGroupMembersQuery";
import { useAddGroupMemberMutation } from "@/queries/useAddGroupMemberMutation";
import { useRemoveGroupMemberMutation } from "@/queries/useRemoveGroupMemberMutation";
import type {
  GroupMember,
  PermissionsGroup,
  UserAutocompleteMatch,
} from "@/types";

// A row in the add-member dropdown: a person to pick, or the pinned action
// that provisions a brand-new account from whatever was typed.
type MemberOption =
  | { kind: "match"; match: UserAutocompleteMatch }
  | { kind: "create"; query: string };

const props = defineProps<{
  group: PermissionsGroup;
  isOpen: boolean;
}>();

const {
  data: members,
  isFetching: isFetchingMembers,
  isPlaceholderData: isMembersPlaceholder,
} = useGroupMembersQuery(() => props.group.id, {
  enabled: () => props.isOpen,
});
const memberList = computed(() => members.value ?? []);

// Only the very first load — the query starts on the placeholder list and a
// fetch is in flight. Cache patches on add/remove never refetch, so this
// stays false for them.
const isLoadingMembers = computed(
  () => isFetchingMembers.value && isMembersPlaceholder.value
);

const search = ref("");
const debouncedSearch = useDebounce(search, 300);
const { data: matches, isFetching: isSearching } =
  useUserAutocompleteQuery(debouncedSearch);
const matchList = computed(() => matches.value ?? []);

// matches first, then a create row pinned to the bottom whenever there is
// text to provision — present even when matches exist, so creating someone
// not in the directory is always one click away
const options = computed<MemberOption[]>(() => {
  const rows: MemberOption[] = matchList.value.map((match) => ({
    kind: "match",
    match,
  }));
  const query = search.value.trim();
  if (query.length > 0) {
    rows.push({ kind: "create", query });
  }
  return rows;
});

const addMutation = useAddGroupMemberMutation();
const removeMutation = useRemoveGroupMemberMutation();

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
  // Close the confirm modal now
  // removal is optimistic, no need to wait for mutation
  memberToRemove.value = null;
}

const columns = createGroupMemberColumns(remove);

const memberIds = computed(
  () => new Set(memberList.value.map((member) => member.userId))
);

function isAlreadyMember(match: UserAutocompleteMatch): boolean {
  return match.localUserId !== null && memberIds.value.has(match.localUserId);
}

// only an existing member is unpickable; the create row is always actionable
function isOptionDisabled(option: MemberOption): boolean {
  return option.kind === "match" && isAlreadyMember(option.match);
}

function add(option: MemberOption) {
  if (option.kind === "create") {
    provision(option.query);
    return;
  }

  const { match } = option;
  if (isAlreadyMember(match)) return;

  // a local match adds by id; a directory match with no local row yet
  // provisions through its remote username
  addMutation.mutate(
    match.localUserId !== null
      ? { groupId: props.group.id, localUserId: match.localUserId }
      : { groupId: props.group.id, remoteUserId: match.username }
  );
  search.value = "";
}

// the create row's text is the remote id to provision — a netid the admin
// typed at a school whose directory the search can't reach
function provision(query: string) {
  const remoteUserId = query.trim();
  if (remoteUserId === "") return;
  addMutation.mutate({ groupId: props.group.id, remoteUserId });
  search.value = "";
}

// username, plus email when the directory gave us one
function secondaryLine(match: UserAutocompleteMatch): string {
  return match.email ? `${match.username} · ${match.email}` : match.username;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
</script>
