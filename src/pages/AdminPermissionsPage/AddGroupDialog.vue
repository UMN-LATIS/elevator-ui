<template>
  <FormDialog
    v-model:open="isOpen"
    title="Create Group"
    submitLabel="Create"
    :isSubmitting="createGroup.isPending.value"
    :isSubmitDisabled="draft.label.trim() === '' || draft.type === ''"
    @submit="save">
    <SelectGroup
      v-model="draft.type"
      label="Group Type"
      placeholder="Select a type…"
      :options="typeOptions" />
    <InputGroup v-model="draft.label" label="Group Name" />
  </FormDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import FormDialog from "@/components/FormDialog/FormDialog.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import { groupTypesQuery, useCreateGroupMutation } from "./groupQueries";
import type { GroupTypeValues, PermissionsGroup, SelectOption } from "@/types";

const emit = defineEmits<{
  created: [group: PermissionsGroup];
}>();

const isOpen = defineModel<boolean>("open", { required: true });

const { data: groupTypes } = useQuery(groupTypesQuery());
const createGroup = useCreateGroupMutation();

type GroupDraft = {
  label: string;
  type: GroupTypeValues | "";
};

const draft = ref<GroupDraft>({ label: "", type: "" });

watch(isOpen, (open) => {
  if (open) draft.value = { label: "", type: "" };
});

const typeOptions = computed((): SelectOption[] =>
  (groupTypes.value ?? []).map((groupType) => ({
    id: groupType.type,
    label: groupType.label,
  }))
);

function save(): void {
  const label = draft.value.label.trim();
  const { type } = draft.value;
  if (label === "" || type === "") return;

  createGroup.mutate(
    { label, type },
    {
      onSuccess: (group) => {
        isOpen.value = false;
        emit("created", group);
      },
    }
  );
}
</script>
