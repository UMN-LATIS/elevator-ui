<template>
  <div class="flex flex-col gap-4">
    <div class="flex justify-start">
      <Button type="submit" variant="secondary" @click="openAddEntryForm">
        Add Entry
      </Button>
    </div>

    <GroupEntriesTable
      :group="group"
      :entries="sortedEntries"
      :isLoading="isLoadingEntries"
      :showEmptyMessage="!isAddingEntry">
      <AddGroupEntryRow v-model:open="isAddingEntry" :group="group" />
    </GroupEntriesTable>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useQuery } from "@tanstack/vue-query";
import Button from "@/components/Button/Button.vue";
import type { PermissionsGroup } from "@/types";
import { groupEntriesQuery } from "./groupQueries";
import GroupEntriesTable from "./GroupEntriesTable.vue";
import AddGroupEntryRow from "./AddGroupEntryRow.vue";
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
