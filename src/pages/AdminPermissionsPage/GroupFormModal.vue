<template>
  <Modal
    :isOpen="isOpen"
    :label="isEditing ? 'Edit Group' : 'Create Group'"
    class="max-w-md"
    @close="handleClose">
    <form @submit.prevent="handleSubmit">
      <InputGroup
        v-model="form.label"
        label="Name"
        placeholder="e.g. Library Staff"
        :error="wasTouched.label ? errors.label : null"
        required
        @blur="wasTouched.label = true" />

      <SelectGroup
        v-model="form.type"
        label="Type"
        placeholder="Select a type…"
        class="my-4"
        :error="wasTouched.type ? errors.type : null"
        :options="typeOptions"
        @update:modelValue="wasTouched.type = true" />

      <div class="flex items-center justify-end gap-2">
        <Button variant="tertiary" type="button" @click="handleClose">
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          :disabled="!canSubmit || isPending">
          {{ isEditing ? "Save Changes" : "Create Group" }}
        </Button>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import Modal from "@/components/Modal/Modal.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import Button from "@/components/Button/Button.vue";
import { useGroupTypesQuery } from "@/queries/useGroupTypesQuery";
import { useCreateGroupMutation } from "@/queries/useCreateGroupMutation";
import { useUpdateGroupMutation } from "@/queries/useUpdateGroupMutation";
import { GroupTypeValues, PermissionsGroup, SelectOption } from "@/types";

const props = defineProps<{
  isOpen: boolean;
  // when present the modal edits this group, otherwise it creates one
  group?: PermissionsGroup | null;
}>();
const emit = defineEmits<{
  (e: "close"): void;
  (e: "created", group: PermissionsGroup): void;
}>();

const { data: labelledGroupTypes } = useGroupTypesQuery();
const createMutation = useCreateGroupMutation();
const updateMutation = useUpdateGroupMutation();

const isEditing = computed(() => Boolean(props.group));
const isPending = computed(
  () => createMutation.isPending.value || updateMutation.isPending.value
);

type GroupForm = {
  label: string;
  type: GroupTypeValues | "";
};

const form = ref<GroupForm>({ label: "", type: "" });
const wasTouched = reactive({ label: false, type: false });

// fill the form each time the modal opens, prefilling from the group in edit
// mode and starting blank in create mode
watch(
  () => [props.isOpen, props.group] as const,
  ([isOpen]) => {
    if (!isOpen) return;
    form.value = {
      label: props.group?.label ?? "",
      type: props.group?.type ?? "",
    };
    wasTouched.label = false;
    wasTouched.type = false;
  },
  { immediate: true }
);

const errors = computed(() => {
  const f = form.value;
  return {
    label: f.label.trim() === "" ? "Group name is required" : null,
    type: f.type === "" ? "Type is required" : null,
  };
});

function isSubmittable(
  form: GroupForm
): form is GroupForm & { type: GroupTypeValues } {
  return form.type !== "" && form.label.trim() !== "";
}

const canSubmit = computed((): boolean => isSubmittable(form.value));

// implemented types
const ENABLED_GROUP_TYPES: GroupTypeValues[] = [
  "All",
  "Authed",
  "Authed_remote",
  "User",
];

const typeOptions = computed((): SelectOption[] =>
  (labelledGroupTypes.value ?? []).map((groupType) => {
    const isEnabled = ENABLED_GROUP_TYPES.includes(groupType.type);
    return {
      id: groupType.type,
      label: isEnabled
        ? groupType.label
        : `${groupType.label} (not implemented)`,
      description: groupType.description,
      disabled: !isEnabled,
    };
  })
);

function handleClose() {
  emit("close");
}

function handleSubmit() {
  form.value.label = form.value.label.trim();

  if (!isSubmittable(form.value)) {
    return;
  }

  const { type, label } = form.value;

  if (props.group) {
    updateMutation.mutate(
      { id: props.group.id, payload: { type, label } },
      { onSuccess: () => emit("close") }
    );
  } else {
    createMutation.mutate(
      { type, label, values: [] },
      {
        onSuccess: (group) => {
          emit("created", group);
          emit("close");
        },
      }
    );
  }
}
</script>
