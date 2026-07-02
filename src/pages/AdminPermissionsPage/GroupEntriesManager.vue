<template>
  <div class="flex flex-col gap-4">
    <form
      class="flex items-start gap-2"
      :data-group-add-entry="group.id"
      @submit.prevent="handleAddEntry">
      <InputGroup
        v-model="newValue"
        class="flex-1"
        label="Add value"
        :labelHidden="true"
        placeholder="Add value..." />
      <Button type="submit" variant="secondary" :disabled="!canAddEntry">
        Add
      </Button>
    </form>

    <GroupEntriesTable
      :group="group"
      :entries="groupEntries ?? []"
      :isLoading="isLoadingEntries"
      :pendingValue="pendingEntryValue" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useQuery } from "@tanstack/vue-query";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import Button from "@/components/Button/Button.vue";
import type { PermissionsGroup } from "@/types";
import { groupEntriesQuery, useAddGroupEntryMutation } from "./groupQueries";
import GroupEntriesTable from "./GroupEntriesTable.vue";

const props = defineProps<{ group: PermissionsGroup; isOpen: boolean }>();

const newValue = ref("");

const { data: groupEntries, isPending: isLoadingEntries } = useQuery(
  groupEntriesQuery(() => props.group.id, { enabled: () => props.isOpen })
);

const addMutation = useAddGroupEntryMutation();

// The in-flight row is derived from the mutation, not written to the cache:
// it shows while the add settles and vanishes when the refetched list lands.
const pendingEntryValue = computed((): string | null => {
  if (!addMutation.isPending.value) return null;
  return addMutation.variables.value?.value ?? null;
});

const canAddEntry = computed((): boolean => newValue.value.trim() !== "");

function handleAddEntry(): void {
  const value = newValue.value.trim();
  if (value === "") return;

  addMutation.mutate({ groupId: props.group.id, value });
  newValue.value = "";
}
</script>
