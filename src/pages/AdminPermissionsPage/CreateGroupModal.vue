<template>
  <Modal
    :isOpen="isOpen"
    label="New group"
    class="max-w-md"
    @close="handleClose">
    <form class="flex flex-col gap-6" @submit.prevent="handleSubmit">
      <p class="-mt-2 text-sm text-on-surface-variant">
        Add a group to this instance.
      </p>

      <InputGroup v-model="form.name" label="Group name" />

      <SelectGroup
        v-model="form.type"
        label="Type"
        placeholder="Select a type…"
        :options="typeOptions" />

      <div class="flex items-center justify-end gap-2">
        <Button variant="tertiary" type="button" @click="handleClose">
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          :disabled="!isValid || mutation.isPending.value">
          Create Group
        </Button>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { computed, reactive } from "vue";
import Modal from "@/components/Modal/Modal.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import Button from "@/components/Button/Button.vue";
import { useGroupTypesQuery } from "@/queries/useGroupTypesQuery";
import { useCreateGroupMutation } from "@/queries/useCreateGroupMutation";
import { PERMISSIONS_GROUP_TYPES } from "@/types";
import type { CreateGroupPayload, PermissionsGroupTypeValues } from "@/types";

defineProps<{ isOpen: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const { data: groupTypes } = useGroupTypesQuery();
const mutation = useCreateGroupMutation();

const form = reactive({
  name: "",
  type: "" as PermissionsGroupTypeValues | "",
});

const typeOptions = computed(() =>
  (groupTypes.value ?? []).map((groupType) => ({
    id: groupType.type,
    label: groupType.label,
    description: groupType.description,
  }))
);

const isValid = computed(() => {
  if (!form.name.trim() || !form.type) return false;
  return true;
});

function resetForm() {
  form.name = "";
  form.type = "";
}

function handleClose() {
  resetForm();
  emit("close");
}

function handleSubmit() {
  if (!isValid.value || form.type === "") return;

  const payload: CreateGroupPayload = {
    type: form.type,
    label: form.name.trim(),
  };

  mutation.mutate(payload, {
    onSuccess: () => {
      resetForm();
      emit("close");
    },
  });
}
</script>
