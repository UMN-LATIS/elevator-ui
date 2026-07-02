<template>
  <div class="flex flex-col gap-4">
    <div :data-group-add-member="group.id">
      <label :for="`group-${group.id}-add-value`" class="sr-only">
        Add value
      </label>
      <AutoCompleteInput
        :id="`group-${group.id}-add-value`"
        v-model="search"
        :items="groupEntryOptions"
        :blurOnSelect="false"
        placeholder="Add value..."
        inputClass="mt-1 w-full bg-surface-container rounded-md px-3 py-2 text-sm">
        <template #option="{ item }">
          <div class="flex items-center gap-2">
            <span>{{ item }}</span>
          </div>
        </template>
      </AutoCompleteInput>
    </div>

    <GroupEntriesTable
      :group="group"
      :entries="groupEntries ?? []"
      :isLoading="isLoadingEntries"
      :pendingValue="pendingEntryValue"
      @save="handleSaveEntry"
      @remove="handleRemoveEntry" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useQuery } from "@tanstack/vue-query";
import AutoCompleteInput from "@/components/AutoCompleteInput/AutoCompleteInput.vue";
import type { PermissionsGroup, PermissionsGroupEntry } from "@/types";
import { groupEntriesQuery, useAddGroupEntryMutation } from "./groupQueries";
import GroupEntriesTable from "./GroupEntriesTable.vue";

const props = defineProps<{ group: PermissionsGroup; isOpen: boolean }>();

const search = ref("");

const { data: groupEntries, isPending: isLoadingEntries } = useQuery(
  groupEntriesQuery(() => props.group.id, { enabled: () => props.isOpen })
);

const addMutation = useAddGroupEntryMutation();

// The in-flight row is derived from the mutation, not written to the cache:
// it shows while the add settles and vanishes when the refetched list lands.
const pendingEntryValue = computed(() =>
  addMutation.isPending.value
    ? addMutation.variables.value?.value ?? null
    : null
);

const groupEntryOptions = computed((): string[] => {
  if (!groupEntries.value) return [];
  return groupEntries.value.map((entry) => entry.value);
});

function handleSaveEntry(_entry: PermissionsGroupEntry): void {
  // TODO: wire once the update entry endpoint exists
}

function handleRemoveEntry(_entry: PermissionsGroupEntry): void {
  // TODO: wire once the remove entry endpoint exists
}
</script>
