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
import { useQuery } from "@tanstack/vue-query";
import {
  groupTypesQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
} from "./groupQueries";
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

const { data: labelledGroupTypes } = useQuery(groupTypesQuery());
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

const typeOptions = computed((): SelectOption[] =>
  (labelledGroupTypes.value ?? []).map((groupType) => {
    return {
      id: groupType.type,
      label: groupType.label,
      description: groupType.description,
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
      {
        // wait for updateMutation invalidations to settle before closing
        onSettled: (_group, error) => {
          if (!error) emit("close");
        },
      }
    );
  } else {
    createMutation.mutate(
      { type, label, values: [] },
      {
        // createMutation has no optimistic update, so wait for the list
        // invalidation to settle before closing, otherwise tryFocus in
        // the parent can't find the new group's row yet
        onSettled: (group) => {
          if (!group) return;
          emit("created", group);
          emit("close");
        },
      }
    );
  }
}
</script>
