<template>
  <div class="flex flex-col gap-4">
    <div>
      <h4 class="text-sm font-bold text-on-surface-variant">Members</h4>
      <p
        v-if="memberList.length === 0"
        class="mt-1 text-sm text-on-surface-variant">
        No members yet.
      </p>
      <ul v-else class="mt-2 flex flex-col gap-1">
        <li v-for="member in memberList" :key="member.userId" class="text-sm">
          {{ member.name }}
          <span class="text-on-surface-variant">{{ member.email }}</span>
        </li>
      </ul>
    </div>

    <div>
      <label
        :for="`group-${group.id}-add-member`"
        class="text-sm font-bold text-on-surface-variant">
        Add member
      </label>
      <AutoCompleteInput
        :id="`group-${group.id}-add-member`"
        v-model="search"
        :items="matchList"
        :isLoading="isSearching"
        :isItemDisabled="(match: UserAutocompleteMatch) => !isAddable(match)"
        :blurOnSelect="false"
        placeholder="Search by name or email…"
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useDebounce } from "@vueuse/core";
import { AutoCompleteInput } from "@/components/AutoCompleteInput";
import { useUserAutocompleteQuery } from "@/queries/useUserAutocompleteQuery";
import { useGroupMembersQuery } from "@/queries/useGroupMembersQuery";
import { useAddGroupMemberMutation } from "@/queries/useAddGroupMemberMutation";
import type { PermissionsGroup, UserAutocompleteMatch } from "@/types";

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
