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
      <InputGroup
        v-model="search"
        label="Add member"
        placeholder="Search by name or email…" />

      <ul v-if="search.trim().length >= 2" class="mt-2 flex flex-col gap-1">
        <li
          v-if="matchList.length === 0"
          class="p-2 text-sm text-on-surface-variant">
          No matches.
        </li>
        <li v-for="match in matchList" :key="match.username">
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded p-2 text-left text-sm hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!isAddable(match) || isAdding"
            @click="add(match)">
            <span>{{ match.name }}</span>
            <span class="text-on-surface-variant">{{ match.email }}</span>
            <span
              v-if="reasonNotAddable(match)"
              class="ml-auto text-xs italic text-on-surface-variant">
              {{ reasonNotAddable(match) }}
            </span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
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
const { data: matches } = useUserAutocompleteQuery(search);
const matchList = computed(() => matches.value ?? []);

const addMutation = useAddGroupMemberMutation();
const isAdding = computed(() => addMutation.isPending.value);

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
}
</script>
