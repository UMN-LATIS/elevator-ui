<template>
  <TableRow>
    <TableCell class="text-sm p-2 text-on-surface">
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

    <ConfirmModal
      :isOpen="isConfirmingRemoval"
      title="Remove entry?"
      type="danger"
      confirmLabel="Remove"
      @confirm="confirmRemove"
      @close="isConfirmingRemoval = false">
      <p>
        Remove
        <strong>{{ entry.value }}</strong>
        from this group?
      </p>
    </ConfirmModal>
  </TableRow>
</template>
<script setup lang="ts">
import type { DrawerGrantGroup, PermissionsGroupEntry } from "@/types";
import { TableRow, TableCell } from "@/components/ui/table";
import { ref } from "vue";
import IconButton from "@/components/IconButton/IconButton.vue";
import { PenIcon, XIcon, CheckIcon, TrashIcon } from "lucide-vue-next";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal.vue";
import GroupEntryValueInput from "./GroupEntryValueInput.vue";
import {
  useUpdateDrawerGroupEntryMutation,
  useRemoveDrawerGroupEntryMutation,
} from "./drawerGroupQueries";
import { useToastStore } from "@/stores/toastStore";

const props = defineProps<{
  group: DrawerGrantGroup;
  entry: PermissionsGroupEntry;
}>();

const toastStore = useToastStore();

const isEditing = ref(false);
const isConfirmingRemoval = ref(false);
const draftValue = ref(props.entry.value);

const { mutate: updateGroupEntry, isPending: isUpdatePending } =
  useUpdateDrawerGroupEntryMutation();
const { mutate: removeGroupEntry, isPending: isDeletePending } =
  useRemoveDrawerGroupEntryMutation();

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

  const previousValue = props.entry.value;

  updateGroupEntry(
    {
      groupId: props.group.id,
      entryId: props.entry.id,
      value: trimmedDraft,
    },
    {
      onSuccess: () =>
        toastStore.success(`"${previousValue}" changed to "${trimmedDraft}".`),
      onError: (error) =>
        toastStore.error(
          `Failed to change "${previousValue}": ${error.message}`,
          { title: "Save Value Failed" }
        ),
    }
  );
}

function handleDelete(): void {
  isConfirmingRemoval.value = true;
}

function confirmRemove(): void {
  const removedValue = props.entry.value;

  removeGroupEntry(
    {
      groupId: props.group.id,
      entryId: props.entry.id,
    },
    {
      onSuccess: () =>
        toastStore.success(
          `"${removedValue}" removed from ${props.group.label}.`
        ),
      onError: (error) =>
        toastStore.error(
          `Failed to remove "${removedValue}" from ${props.group.label}: ${error.message}`,
          { title: "Remove Value Failed" }
        ),
    }
  );
  // Close the confirm modal right away. The row shows "(removing…)" until
  // the refetch drops it, and a failure surfaces as an error toast.
  isConfirmingRemoval.value = false;
}
</script>
<style scoped></style>
