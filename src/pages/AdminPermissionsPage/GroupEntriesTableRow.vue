<template>
  <TableRow>
    <TableCell class="text-sm p-2">
      <p v-if="!isEditing">{{ entry.value }}</p>
      <InputGroup
        v-else
        v-model="draftValue"
        :label="`Group ${group.label} Entry Value`"
        :labelHidden="true" />
    </TableCell>
    <TableCell class="text-sm p-2">
      <div class="flex justify-end gap-1">
        <template v-if="isEditing">
          <IconButton
            title="Save"
            :data-group-entry-remove="entry.id"
            class="enabled:hover:bg-primary-container enabled:hover:text-on-primary-container"
            :aria-label="`Save ${entry.value} in ${group.label}`"
            @click="handleSave">
            <CheckIcon class="size-4" />
          </IconButton>
          <IconButton
            title="Cancel"
            :data-group-entry-remove="entry.id"
            class="enabled:hover:bg-secondary-container enabled:hover:text-on-secondary-container"
            :aria-label="`Cancel editing ${entry.value} in ${group.label}`"
            @click="isEditing = false">
            <XIcon class="size-4" />
          </IconButton>
        </template>
        <template v-else>
          <IconButton
            title="Edit"
            :data-group-entry-remove="entry.id"
            class="enabled:hover:bg-secondary-container enabled:hover:text-on-secondary-container"
            :aria-label="`Edit ${entry.value} in ${group.label}`"
            @click="handleEdit">
            <PenIcon class="size-4" />
          </IconButton>
          <IconButton
            title="Remove"
            :data-group-entry-remove="entry.id"
            class="enabled:hover:bg-error-container enabled:hover:text-on-error-container"
            :aria-label="`Remove ${entry.value} from ${group.label}`">
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
import { ref, watch } from "vue";
import IconButton from "@/components/IconButton/IconButton.vue";
import { PenIcon, XIcon, CheckIcon, TrashIcon } from "lucide-vue-next";
import InputGroup from "@/components/InputGroup/InputGroup.vue";

const props = defineProps<{
  group: PermissionsGroup;
  entry: PermissionsGroupEntry;
}>();

const emit = defineEmits<{
  (eventName: "save", entry: PermissionsGroupEntry): void;
  (eventName: "remove", entry: PermissionsGroupEntry): void;
}>();

const isEditing = ref(false);
const draftValue = ref(props.entry.value);

function handleEdit() {
  isEditing.value = true;
  draftValue.value = props.entry.value;
}

function handleSave() {
  isEditing.value = false;

  const trimmedDraft = draftValue.value.trim();
  if (trimmedDraft === props.entry.value) {
    return;
  }

  emit("save", {
    ...props.entry,
    value: trimmedDraft,
  });
}

watch(
  () => props.entry.value,
  (newValue) => {
    // don't clobber any draft value if editing
    if (isEditing.value) return;
    // otherwise update
    draftValue.value = newValue;
  }
);
</script>
<style scoped></style>
