<template>
  <TableRow v-if="isPending || isOpen">
    <TableCell :colspan="colspan" class="text-sm p-2">
      <p v-if="isPending">{{ pendingName }} (adding…)</p>
      <form
        v-else
        class="flex items-center gap-2"
        :data-group-add-member-form="group.id"
        @submit.prevent="handleSave">
        <div class="flex-1">
          <label :for="`group-${group.id}-add-member`" class="sr-only">
            Add member
          </label>
          <AutoCompleteInput
            :id="`group-${group.id}-add-member`"
            :modelValue="search"
            :items="options"
            :isLoading="isSearching"
            :isItemDisabled="isOptionDisabled"
            :blurOnSelect="false"
            :minChars="2"
            placeholder="Add member by name, email, or username…"
            :inputClass="`w-full bg-surface border-outline-variant group-member-add__input--${group.id}`"
            @update:modelValue="handleSearchInput"
            @select="handleSelect">
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
        <Button
          title="Save"
          type="submit"
          variant="primary"
          class="py-2 border border-secondary-container"
          :data-group-add-member-save="group.id"
          aria-label="Save new member">
          <CheckIcon class="size-4" />
          Save
        </Button>
        <Button
          title="Cancel"
          variant="tertiary"
          class="py-2"
          :data-group-add-member-cancel="group.id"
          aria-label="Cancel new member"
          @click="closeForm">
          <XIcon class="size-4" />
          Cancel
        </Button>
      </form>
    </TableCell>
  </TableRow>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import { useDebounce } from "@vueuse/core";
import { useQuery } from "@tanstack/vue-query";
import { TableRow, TableCell } from "@/components/ui/table";
import { XIcon, CheckIcon, PlusIcon } from "lucide-vue-next";
import { AutoCompleteInput } from "@/components/AutoCompleteInput";
import { useUserAutocompleteQuery } from "@/queries/useUserAutocompleteQuery";
import { groupMembersQuery, useAddGroupMemberMutation } from "./groupQueries";
import type { PermissionsGroup, UserAutocompleteMatch } from "@/types";
import Button from "@/components/Button/Button.vue";

// A row in the add-member dropdown: a person to pick, or the pinned action
// that provisions a brand-new account from whatever was typed.
type MemberOption =
  | { kind: "match"; match: UserAutocompleteMatch }
  | { kind: "create"; query: string };

const props = defineProps<{
  group: PermissionsGroup;
  colspan: number;
}>();

// The in-flight "(adding…)" row renders here from the mutation, so the
// parent toggles `open` instead of v-if. Unmounting would drop that row
// while the add is still settling.
const isOpen = defineModel<boolean>("open", { required: true });

const search = ref("");
const debouncedSearch = useDebounce(search, 300);
const { data: matches, isFetching } = useUserAutocompleteQuery(debouncedSearch);
const matchList = computed(() => matches.value ?? []);

// The debounce window counts as loading too: while the query waits for
// typing to settle, matches still reflect the previous term, and the
// dropdown must not present them as current.
const isSearching = computed(
  () => isFetching.value || search.value.trim() !== debouncedSearch.value.trim()
);

// matches first, then a create row pinned to the bottom whenever there is
// text to provision, present even when matches exist, so creating someone
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

// Shares the cache entry the surrounding members table already fetched.
const { data: members } = useQuery(groupMembersQuery(() => props.group.id));

const memberIds = computed(
  () => new Set((members.value ?? []).map((member) => member.userId))
);

function isAlreadyMember(match: UserAutocompleteMatch): boolean {
  return match.localUserId !== null && memberIds.value.has(match.localUserId);
}

// only an existing member is unpickable, the create row is always actionable
function isOptionDisabled(option: MemberOption): boolean {
  return option.kind === "match" && isAlreadyMember(option.match);
}

// the picked option, held until Save commits it
const stagedOption = ref<MemberOption | null>(null);

// Selecting fills the input with the username (the one field that stays
// meaningful as plain text) rather than saving, mirroring the entries
// row's fill-on-select behavior.
function handleSelect(option: MemberOption): void {
  stagedOption.value = option;
  search.value = option.kind === "match" ? option.match.username : option.query;
}

// Typing after a pick invalidates the pick: the text no longer describes
// the staged person, so Save falls back to provisioning the typed text.
function handleSearchInput(value: string): void {
  search.value = value;
  stagedOption.value = null;
}

const {
  mutate: addGroupMember,
  isPending,
  variables,
} = useAddGroupMemberMutation();

// Show who was submitted, not the live input the user may keep editing.
const pendingName = computed(() => variables.value?.name ?? "");

function closeForm(): void {
  isOpen.value = false;
  search.value = "";
  stagedOption.value = null;
}

function handleSave(): void {
  const staged = stagedOption.value;
  if (staged) {
    commitAdd(staged);
    return;
  }

  const typed = search.value.trim();

  // a blank search has nothing to save, treat it as a cancel
  if (typed === "") {
    closeForm();
    return;
  }

  commitAdd({ kind: "create", query: typed });
}

function commitAdd(option: MemberOption): void {
  // the create row's text is the remote id to provision, a netid the admin
  // typed at a school whose directory the search can't reach
  if (option.kind === "create") {
    addGroupMember(
      {
        groupId: props.group.id,
        remoteUserId: option.query,
        name: option.query,
      },
      { onSuccess: closeForm }
    );
    return;
  }

  const { match } = option;

  // a local match adds by id, a directory match with no local row yet
  // provisions through its remote username
  addGroupMember(
    match.localUserId !== null
      ? {
          groupId: props.group.id,
          localUserId: match.localUserId,
          name: match.name,
        }
      : {
          groupId: props.group.id,
          remoteUserId: match.username,
          name: match.name,
        },
    { onSuccess: closeForm }
  );
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
<style scoped></style>
