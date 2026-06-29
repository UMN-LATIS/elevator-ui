<template>
  <Modal
    :isOpen="isOpen"
    label="Create Group"
    class="max-w-md"
    @close="handleClose">
    <form class="flex flex-col gap-6" @submit.prevent="handleSubmit">
      <InputGroup
        v-model="form.label"
        label="Name"
        placeholder="e.g. Library Staff"
        required
        @blur="wasTouched.label = true" />
      <p v-if="wasTouched.label && errors.label" class="text-error">
        {{ errors.label }}
      </p>

      <SelectGroup
        v-model="form.type"
        label="Type"
        placeholder="Select a type…"
        :options="typeOptions"
        @update:modelValue="wasTouched.type = true" />
      <p v-if="wasTouched.type && errors.type" class="text-error">
        {{ errors.type }}
      </p>

      <div class="flex items-center justify-end gap-2">
        <Button variant="tertiary" type="button" @click="handleClose">
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          :disabled="!canSubmit || mutation.isPending.value">
          Create Group
        </Button>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import Modal from "@/components/Modal/Modal.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import Button from "@/components/Button/Button.vue";
import { useGroupTypesQuery } from "@/queries/useGroupTypesQuery";
import { useCreateGroupMutation } from "@/queries/useCreateGroupMutation";
import { GroupTypeValues, SelectOption } from "@/types";

defineProps<{ isOpen: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const { data: labelledGroupTypes } = useGroupTypesQuery();
const mutation = useCreateGroupMutation();

type CreateGroupForm = {
  label: string;
  type: GroupTypeValues | "";
  values: string[]; // todo GroupMembers array
};

const form = ref<CreateGroupForm>({
  label: "",
  type: "",
  values: [],
});

const errors = computed(() => {
  const f = form.value;
  return {
    label: f.label.trim() === "" ? "Group name is required" : null,
    type: f.type === "" ? "Type is required" : null,
  };
});

function isSubmittable(
  form: CreateGroupForm
): form is CreateGroupForm & { type: GroupTypeValues } {
  return form.type !== "" && form.label.trim() !== "";
}

const canSubmit = computed((): boolean => isSubmittable(form.value));

const wasTouched = reactive({
  label: false,
  type: false,
});

const typeOptions = computed((): SelectOption[] =>
  (labelledGroupTypes.value ?? []).map((groupType) => ({
    id: groupType.type,
    label: groupType.label,
    description: groupType.description,
  }))
);

function resetForm() {
  form.value = {
    label: "",
    type: "",
    values: [],
  };
}

function handleClose() {
  resetForm();
  emit("close");
}

function handleSubmit() {
  form.value.label = form.value.label.trim();

  if (!isSubmittable(form.value)) {
    return;
  }

  mutation.mutate(form.value, {
    onSuccess: () => {
      resetForm();
      emit("close");
    },
  });
}
</script>
