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
      :isLoading="isLoadingValues"
      @save="handleSaveEntry"
      @remove="handleRemoveEntry" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toValue } from "vue";
import AutoCompleteInput from "@/components/AutoCompleteInput/AutoCompleteInput.vue";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal.vue";
import type { PermissionsGroup, PermissionsGroupEntry } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import {
  GROUP_VALUES_QUERY_KEY,
  PERMISSIONS_GROUPS_QUERY_KEY,
} from "@/queries/queryKeys";
import {
  addGroupEntry,
  AddGroupEntryInput,
  fetchGroupEntries,
} from "@/api/fetchers";
import GroupEntriesTable from "./GroupEntriesTable.vue";

const props = defineProps<{ group: PermissionsGroup; isOpen: boolean }>();

const search = ref("");

const groupEntriesQueryKey = computed(() => [
  PERMISSIONS_GROUPS_QUERY_KEY,
  props.group.id,
  GROUP_VALUES_QUERY_KEY,
]);

const { data: groupEntries, isLoading: isLoadingValues } = useQuery({
  queryKey: groupEntriesQueryKey,
  queryFn: () => fetchGroupEntries(toValue(props.group.id)),
});

const queryClient = useQueryClient();

const { mutate: addEntry } = useMutation({
  mutationFn: addGroupEntry,
  onSuccess: (entry: PermissionsGroupEntry, vars: AddGroupEntryInput) => {
    // update the group entries with the new data
    queryClient.setQueryData<PermissionsGroupEntry[]>(
      groupEntriesQueryKey.value,
      (entries = []) =>
        entries.some((e) => e.id === entry.id) ? entries : [...entries, entry]
    );
  },
  onError: (error) => {
    console.error("Error adding group entry:", error);
  },
});

const groupEntryOptions = computed((): string[] => {
  if (!groupEntries.value) return [];
  return groupEntries.value.map((entry) => entry.value);
});

function handleSaveEntry(entry: { id: string; value: string }) {
  // emit event to parent to handle saving the entry
}
</script>
