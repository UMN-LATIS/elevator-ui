<template>
  <TableRow v-if="isPending || isOpen">
    <TableCell class="text-sm p-2" :colspan="colspan">
      <p v-if="isPending">{{ pendingValue }} (saving...)</p>
      <form
        v-else
        class="flex items-center gap-2"
        :data-group-entry-add-form="group.id"
        @submit.prevent="handleSave">
        <GroupEntryValueInput
          v-model="draftValue"
          class="flex-1"
          :group="group"
          :inputId="`group-entry-add-input-${group.id}`"
          :inputClass="`group-entry-add__input--${group.id}`"
          :label="`New ${group.label} Entry Value`" />
        <Button
          type="submit"
          :data-group-entry-add-save="group.id"
          variant="secondary"
          class="py-2 border border-secondary-container"
          :aria-label="`Save new entry in ${group.label}`">
          <CheckIcon class="size-4" />
          Save
        </Button>
        <Button
          type="button"
          :data-group-entry-add-cancel="group.id"
          variant="tertiary"
          class="py-2"
          :aria-label="`Cancel new entry in ${group.label}`"
          @click="closeForm">
          <XIcon class="size-4" />
          Cancel
        </Button>
      </form>
    </TableCell>
  </TableRow>
</template>
<script setup lang="ts">
import type { DrawerGrantGroup } from "@/types";
import { TableRow, TableCell } from "@/components/ui/table";
import { computed, ref } from "vue";
import { XIcon, CheckIcon } from "lucide-vue-next";
import GroupEntryValueInput from "./GroupEntryValueInput.vue";
import { useAddDrawerGroupEntryMutation } from "./drawerGroupQueries";
import { useToastStore } from "@/stores/toastStore";
import Button from "@/components/Button/Button.vue";

const props = withDefaults(
  defineProps<{ group: DrawerGrantGroup; colspan?: number }>(),
  {
    colspan: 2,
  }
);

const toastStore = useToastStore();

// The in-flight "(saving...)" row renders here from the mutation, so the
// parent toggles `open` instead of v-if. Unmounting would drop that row
// while the add is still settling.
const isOpen = defineModel<boolean>("open", { required: true });

const draftValue = ref("");

const {
  mutate: addGroupEntry,
  isPending,
  variables,
} = useAddDrawerGroupEntryMutation();

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
    {
      onSuccess: () => {
        closeForm();
        toastStore.success(`"${trimmedDraft}" added to ${props.group.label}.`);
      },
      onError: (error) =>
        toastStore.error(
          `Failed to add "${trimmedDraft}" to ${props.group.label}: ${error.message}`,
          { title: "Add Value Failed" }
        ),
    }
  );
}
</script>
<style scoped></style>
