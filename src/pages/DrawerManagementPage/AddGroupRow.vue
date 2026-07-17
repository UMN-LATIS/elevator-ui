<template>
  <TableRow v-if="isPending || isOpen" class="hover:bg-transparent">
    <TableCell :colspan="colspan" class="p-2 text-sm">
      <p v-if="isPending">{{ draft.label }} (saving…)</p>
      <form
        v-else
        class="flex flex-wrap items-end gap-2"
        data-add-group-form
        @submit.prevent="handleSave">
        <InputGroup
          v-model="draft.label"
          label="Group Name"
          placeholder="e.g. Spring Seminar"
          inputClass="add-group__name-input"
          class="min-w-48 flex-1" />
        <SelectGroup
          v-model="draft.type"
          label="Group Type"
          placeholder="Select a type…"
          class="w-44"
          :options="typeOptions" />
        <PermissionSelect
          v-model="draft.permissionLevelId"
          label="Permission"
          placeholder="Select a permission…"
          class="w-44"
          :options="permissionOptions" />
        <Button
          type="submit"
          variant="secondary"
          class="py-2 border border-secondary-container"
          :disabled="!canSubmit">
          <CheckIcon class="size-4" />
          Save
        </Button>
        <Button type="button" variant="tertiary" class="py-2" @click="close">
          <XIcon class="size-4" />
          Cancel
        </Button>
      </form>
    </TableCell>
  </TableRow>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { CheckIcon, XIcon } from "lucide-vue-next";
import { TableRow, TableCell } from "@/components/ui/table";
import Button from "@/components/Button/Button.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import PermissionSelect from "@/components/PermissionSelect/PermissionSelect.vue";
import { buildPermissionOptions } from "@/components/PermissionSelect/buildPermissionOptions";
import { useInstanceStore } from "@/stores/instanceStore";
import { useToastStore } from "@/stores/toastStore";
import {
  drawerGroupTypesQuery,
  useCreateDrawerGroupMutation,
} from "./drawerGroupQueries";
import { useCreateDrawerGrantMutation } from "./drawerGrantQueries";
import { toGroupTypeOptions } from "./toGroupTypeOptions";
import { permissionLevelsQuery } from "@/queries/permissionLevelsQuery";
import type { GroupTypeValues, PermissionsGroup, SelectOption } from "@/types";

const props = defineProps<{
  drawerId: number;
  colspan: number;
}>();

const emit = defineEmits<{
  created: [group: PermissionsGroup];
}>();

// The in-flight "(saving…)" row renders here from the mutations, so the
// parent toggles `open` instead of v-if. Unmounting would drop that row
// while the save is still settling.
const isOpen = defineModel<boolean>("open", { required: true });

const instanceStore = useInstanceStore();
const toastStore = useToastStore();
const { data: groupTypes } = useQuery(drawerGroupTypesQuery());
const { data: permissionLevels } = useQuery(permissionLevelsQuery());
const createGroup = useCreateDrawerGroupMutation();
const createGrant = useCreateDrawerGrantMutation();

const isPending = computed(
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

// The group this form already created, kept so a retry after a failed
// grant reuses it instead of creating a second one. Editing the name and
// retrying only resends the grant: renaming is the table editor's job.
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
    isAdmin: instanceStore.currentUser?.isAdmin ?? false,
  })
);

const permissionOptions = computed(() =>
  buildPermissionOptions(permissionLevels.value ?? [])
);

const canSubmit = computed(
  (): boolean =>
    draft.value.label.trim() !== "" &&
    draft.value.type !== "" &&
    draft.value.permissionLevelId !== null
);

function close(): void {
  isOpen.value = false;
}

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
    // a failed save toasted from its own onError, this only keeps the
    // form up to try again
  }
}
</script>
