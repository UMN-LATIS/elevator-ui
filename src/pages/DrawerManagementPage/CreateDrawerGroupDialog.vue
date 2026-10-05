<template>
  <FormDialog
    v-model:open="isOpen"
    title="Create Group"
    submitLabel="Create"
    :isSubmitting="isSaving"
    :isSubmitDisabled="!canSubmit"
    @submit="handleSave">
    <SelectGroup
      v-model="draft.type"
      label="Group Type"
      placeholder="Select a type…"
      :options="typeOptions" />
    <InputGroup
      v-model="draft.label"
      label="Group Name"
      placeholder="e.g. Spring Seminar" />
    <PermissionSelect
      v-model="draft.permissionLevelId"
      label="Permission"
      placeholder="Select a permission…"
      :options="permissionOptions" />
  </FormDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import FormDialog from "@/components/FormDialog/FormDialog.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import PermissionSelect from "@/components/PermissionSelect/PermissionSelect.vue";
import { buildPermissionOptions } from "@/components/PermissionSelect/buildPermissionOptions";
import { useCurrentUser } from "@/composables/useCurrentUser";
import { useToastStore } from "@/stores/toastStore";
import {
  drawerGroupTypesQuery,
  useCreateDrawerGroupMutation,
} from "./drawerGroupQueries";
import { useCreateDrawerGrantMutation } from "./drawerGrantQueries";
import { toGroupTypeOptions } from "./toGroupTypeOptions";
import { permissionLevelsQuery } from "@/queries/permissionLevelsQuery";
import {
  PERM,
  type GroupTypeValues,
  type PermissionsGroup,
  type SelectOption,
} from "@/types";

const props = defineProps<{
  drawerId: number;
}>();

const emit = defineEmits<{
  created: [group: PermissionsGroup];
}>();

const isOpen = defineModel<boolean>("open", { required: true });

const { currentUser } = useCurrentUser();
const toastStore = useToastStore();
const { data: groupTypes } = useQuery(drawerGroupTypesQuery());
const { data: permissionLevels } = useQuery(permissionLevelsQuery());
const createGroup = useCreateDrawerGroupMutation();
const createGrant = useCreateDrawerGrantMutation();

const isSaving = computed(
  (): boolean => createGroup.isPending.value || createGrant.isPending.value
);

type GroupDraft = {
  label: string;
  type: GroupTypeValues | "";
  permissionLevelId: number | null;
};

function blankDraft(): GroupDraft {
  return { label: "", type: "", permissionLevelId: null };
}

const draft = ref<GroupDraft>(blankDraft());

// The group this form already created, kept so a
// retry after a failed grant reuses it instead of
// creating a second one. Editing the name and
// retrying only resends the grant: renaming is the
// edit dialog's job.
const createdGroup = ref<PermissionsGroup | null>(null);

// start each open from an empty form
watch(isOpen, (open) => {
  if (open) {
    draft.value = blankDraft();
    createdGroup.value = null;
  }
});

const typeOptions = computed((): SelectOption[] =>
  toGroupTypeOptions(groupTypes.value ?? [], {
    isAdmin: currentUser.value?.isAdmin ?? false,
  })
);

const permissionOptions = computed(() => {
  const allLevels = permissionLevels.value ?? [];
  return buildPermissionOptions(
    allLevels.filter((l) => l.level <= PERM.ORIGINALS)
  );
});

const canSubmit = computed(
  (): boolean =>
    draft.value.label.trim() !== "" &&
    draft.value.type !== "" &&
    draft.value.permissionLevelId !== null
);

async function handleSave(): Promise<void> {
  const { type, permissionLevelId } = draft.value;
  const label = draft.value.label.trim();
  if (label === "" || type === "" || permissionLevelId === null) return;

  // The group has to exist before anything can be granted to it, so the
  // two saves run in order rather than together.
  try {
    if (createdGroup.value === null) {
      createdGroup.value = await createGroup.mutateAsync(
        { label, type },
        {
          onError: (error) =>
            toastStore.error(error.message, {
              title: `Could not create group "${label}"`,
            }),
        }
      );
    }
    const group = createdGroup.value;

    await createGrant.mutateAsync(
      {
        drawerId: props.drawerId,
        drawerGroupId: group.id,
        permissionLevelId,
      },
      {
        // The group survives a failed grant, so say so: the retry grants
        // access to that group rather than creating a second one.
        onError: (error) =>
          toastStore.error(
            `Group "${group.label}" was created, but its access could not be saved: ${error.message}`,
            { title: "Could not save access" }
          ),
      }
    );

    toastStore.success(`Group "${group.label}" created.`);
    isOpen.value = false;
    emit("created", group);
  } catch {
    // a failed save toasted from its own onError. This
    // catch only keeps the dialog open to try again.
  }
}
</script>
