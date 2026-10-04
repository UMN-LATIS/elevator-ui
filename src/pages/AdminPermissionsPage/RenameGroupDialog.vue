<template>
  <FormDialog
    v-model:open="isOpen"
    title="Edit Group"
    :isSubmitting="updateGroup.isPending.value"
    :isSubmitDisabled="draftLabel.trim() === ''"
    @submit="save">
    <InputGroup v-model="draftLabel" label="Group name" />
  </FormDialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import FormDialog from "@/components/FormDialog/FormDialog.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import { useUpdateGroupMutation } from "./groupQueries";
import type { PermissionsGroup } from "@/types";

const props = defineProps<{
  group: PermissionsGroup | null;
}>();

const isOpen = defineModel<boolean>("open", { required: true });

const updateGroup = useUpdateGroupMutation();
const draftLabel = ref("");

watch(isOpen, (open) => {
  if (open && props.group) draftLabel.value = props.group.label;
});

function save(): void {
  const group = props.group;
  const label = draftLabel.value.trim();
  if (!group || label === "") return;
  if (label === group.label) {
    isOpen.value = false;
    return;
  }

  updateGroup.mutate(
    { id: group.id, payload: { label, type: group.type } },
    { onSuccess: () => (isOpen.value = false) }
  );
}
</script>
