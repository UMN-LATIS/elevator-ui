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

// start each open from an empty form
watch(isOpen, (open) => {
  if (open) draft.value = blankDraft();
});

const typeOptions = computed((): SelectOption[] =>
  toGroupTypeOptions(groupTypes.value ?? [], {
    isAdmin: instanceStore.currentUser?.isAdmin ?? false,
  })
);

// Level 0 grants no access, since access resolves to the highest matching
// level. A rule can still hold it: the legacy editor starts every drawer
// permission there, so this form can put a group in the same state.
const permissionOptions = computed(() =>
  buildPermissionOptions(permissionLevels.value ?? [], {
    includesNoPermissions: true,
  })
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
  // two saves run in order rather than together. Each mutation toasts its
  // own failure, and a failed create leaves the form up to try again.
  try {
    const group = await createGroup.mutateAsync({ label, type });
    await createGrant.mutateAsync({
      drawerId: props.drawerId,
      drawerGroupId: group.id,
      permissionLevelId,
    });
    isOpen.value = false;
    emit("created", group);
  } catch {
    // the mutation's own onError already said so
  }
}
</script>
