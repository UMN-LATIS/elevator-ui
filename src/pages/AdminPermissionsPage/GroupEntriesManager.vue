<template>
  <GroupEntriesTable
    :group="group"
    :entries="sortedEntries"
    :isLoading="isLoadingEntries"
    :showEmptyMessage="!isAddingEntry">
    <AddGroupEntryRow v-model:open="isAddingEntry" :group="group" />
    <AddRowButton
      v-if="!isAddingEntry"
      :colspan="2"
      label="Add Entry"
      :data-group-entry-add-button="group.id"
      @click="openAddEntryForm" />
  </GroupEntriesTable>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useQuery } from "@tanstack/vue-query";
import type { PermissionsGroup } from "@/types";
import { groupEntriesQuery } from "./groupQueries";
import GroupEntriesTable from "./GroupEntriesTable.vue";
import AddGroupEntryRow from "./AddGroupEntryRow.vue";
import AddRowButton from "./AddRowButton.vue";
import { tryFocus } from "@/helpers/tryFocus";

const props = defineProps<{ group: PermissionsGroup; isOpen: boolean }>();

const isAddingEntry = ref(false);

const { data: groupEntries, isPending: isLoadingEntries } = useQuery(
  groupEntriesQuery(() => props.group.id, { enabled: () => props.isOpen })
);

const sortedEntries = computed(() => {
  const entries = groupEntries.value ?? [];
  return entries.toSorted((a, b) => a.value.localeCompare(b.value));
});

function openAddEntryForm(): void {
  isAddingEntry.value = true;

  // focus the add form's input field after next render
  tryFocus(() =>
    document.querySelector<HTMLInputElement>(
      `.group-entry-add__input--${props.group.id}`
    )
  );
}
</script>
