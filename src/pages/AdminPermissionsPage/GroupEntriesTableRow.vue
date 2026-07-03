<template>
  <TableRow>
    <TableCell class="text-sm p-2">
      <form
        v-if="isEditing"
        class="flex items-start gap-2"
        :data-group-entry-edit-form="entry.id"
        @submit.prevent="handleSave">
        <GroupEntryValueInput
          v-model="draftValue"
          class="flex-1"
          :group="group"
          :excludeValue="entry.value"
          :inputId="`group-entry-edit-input-${entry.id}`"
          :inputClass="`group-entry__input--${entry.id}`"
          :label="`Group ${group.label} Entry Value`" />
        <IconButton
          title="Save"
          :data-group-entry-save="entry.id"
          class="enabled:hover:bg-primary-container enabled:hover:text-on-primary-container"
          :aria-label="`Save ${entry.value} in ${group.label}`"
          @click="handleSave">
          <CheckIcon class="size-4" />
        </IconButton>
        <IconButton
          title="Cancel"
          :data-group-entry-cancel="entry.id"
          class="enabled:hover:bg-secondary-container enabled:hover:text-on-secondary-container"
          :aria-label="`Cancel editing ${entry.value} in ${group.label}`"
          @click="handleCancel">
          <XIcon class="size-4" />
        </IconButton>
      </form>
      <p v-else-if="isUpdatePending">{{ draftValue }} (saving...)</p>
      <p v-else-if="isDeletePending">
        <s>{{ entry.value }}</s>
        (removing…)
      </p>
      <p v-else>{{ entry.value }}</p>
    </TableCell>
    <TableCell class="text-sm p-2">
      <div class="flex justify-end gap-1">
        <template v-if="!isEditing">
          <IconButton
            title="Edit"
            :data-group-entry-edit="entry.id"
            class="enabled:hover:bg-secondary-container enabled:hover:text-on-secondary-container"
            :aria-label="`Edit ${entry.value} in ${group.label}`"
            @click="handleEdit">
            <PenIcon class="size-4" />
          </IconButton>
          <IconButton
            title="Remove"
            :data-group-entry-remove="entry.id"
            class="enabled:hover:bg-error-container enabled:hover:text-on-error-container"
            :aria-label="`Remove ${entry.value} from ${group.label}`"
            @click="handleDelete">
            <TrashIcon class="size-4" />
          </IconButton>
        </template>
      </div>
    </TableCell>
  </TableRow>
</template>
<script setup lang="ts">
import type { PermissionsGroup, PermissionsGroupEntry } from "@/types";
import { TableRow, TableCell } from "@/components/ui/table";
import { ref } from "vue";
import IconButton from "@/components/IconButton/IconButton.vue";
import { PenIcon, XIcon, CheckIcon, TrashIcon } from "lucide-vue-next";
import GroupEntryValueInput from "./GroupEntryValueInput.vue";
import {
  useUpdateGroupEntryMutation,
  useRemoveGroupEntryMutation,
} from "./groupQueries";

const props = defineProps<{
  group: PermissionsGroup;
  entry: PermissionsGroupEntry;
}>();

const isEditing = ref(false);
const draftValue = ref(props.entry.value);

const { mutate: updateGroupEntry, isPending: isUpdatePending } =
  useUpdateGroupEntryMutation();
const { mutate: removeGroupEntry, isPending: isDeletePending } =
  useRemoveGroupEntryMutation();

function handleEdit(): void {
  draftValue.value = props.entry.value;
  isEditing.value = true;
}

function handleCancel(): void {
  isEditing.value = false;
  draftValue.value = props.entry.value;
}

function handleSave(): void {
  isEditing.value = false;
  const trimmedDraft = draftValue.value.trim();

  if (trimmedDraft === props.entry.value) return;

  updateGroupEntry({
    groupId: props.group.id,
    entryId: props.entry.id,
    value: trimmedDraft,
  });
}

function handleDelete(): void {
  removeGroupEntry({
    groupId: props.group.id,
    entryId: props.entry.id,
  });
}
</script>
<style scoped></style>
