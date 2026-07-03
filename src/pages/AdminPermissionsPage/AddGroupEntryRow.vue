<template>
  <TableRow v-if="isPending || isOpen">
    <TableCell class="text-sm p-2">
      <p v-if="isPending">{{ pendingValue }} (saving...)</p>
      <form
        v-else
        class="flex items-start gap-2"
        :data-group-entry-add-form="group.id"
        @submit.prevent="handleSave">
        <GroupEntryValueInput
          v-model="draftValue"
          class="flex-1"
          :group="group"
          :inputId="`group-entry-add-input-${group.id}`"
          :inputClass="`group-entry-add__input--${group.id}`"
          :label="`New ${group.label} Entry Value`" />
        <IconButton
          title="Save"
          :data-group-entry-add-save="group.id"
          class="enabled:hover:bg-primary-container enabled:hover:text-on-primary-container"
          :aria-label="`Save new entry in ${group.label}`"
          @click="handleSave">
          <CheckIcon class="size-4" />
        </IconButton>
        <IconButton
          title="Cancel"
          :data-group-entry-add-cancel="group.id"
          class="enabled:hover:bg-secondary-container enabled:hover:text-on-secondary-container"
          :aria-label="`Cancel new entry in ${group.label}`"
          @click="closeForm">
          <XIcon class="size-4" />
        </IconButton>
      </form>
    </TableCell>
    <TableCell class="text-sm p-2" />
  </TableRow>
</template>
<script setup lang="ts">
import type { PermissionsGroup } from "@/types";
import { TableRow, TableCell } from "@/components/ui/table";
import { computed, ref } from "vue";
import IconButton from "@/components/IconButton/IconButton.vue";
import { XIcon, CheckIcon } from "lucide-vue-next";
import GroupEntryValueInput from "./GroupEntryValueInput.vue";
import { useAddGroupEntryMutation } from "./groupQueries";

const props = defineProps<{ group: PermissionsGroup }>();

// The in-flight "(saving...)" row renders here from the mutation, so the
// parent toggles `open` instead of v-if. Unmounting would drop that row
// while the add is still settling.
const isOpen = defineModel<boolean>("open", { required: true });

const draftValue = ref("");

const {
  mutate: addGroupEntry,
  isPending,
  variables,
} = useAddGroupEntryMutation();

// Show what was submitted, not the live input the user may keep editing.
const pendingValue = computed(() => variables.value?.value ?? "");

function closeForm(): void {
  isOpen.value = false;
  draftValue.value = "";
}

function handleSave(): void {
  const trimmedDraft = draftValue.value.trim();

  // a blank draft has nothing to save, treat it as a cancel
  if (trimmedDraft === "") {
    closeForm();
    return;
  }

  // Close only on success so a failed add reopens the form with the
  // typed value still in place for a retry.
  addGroupEntry(
    { groupId: props.group.id, value: trimmedDraft },
    { onSuccess: closeForm }
  );
}
</script>
<style scoped></style>
