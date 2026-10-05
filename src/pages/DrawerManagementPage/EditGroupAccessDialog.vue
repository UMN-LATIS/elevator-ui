<template>
  <FormDialog
    v-model:open="isOpen"
    title="Edit Group"
    :description="row ? toGroupSummary(row.group, row.typeLabel) : undefined"
    :isSubmitting="isSaving"
    :isSubmitDisabled="isDraftIncomplete"
    @submit="save">
    <InputGroup
      v-if="row?.group.ownedByCurrentUser"
      v-model="draftLabel"
      label="Group Name" />
    <PermissionSelect
      v-model="draftLevelId"
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
import PermissionSelect from "@/components/PermissionSelect/PermissionSelect.vue";
import { buildPermissionOptions } from "@/components/PermissionSelect/buildPermissionOptions";
import { permissionLevelsQuery } from "@/queries/permissionLevelsQuery";
import { useToastStore } from "@/stores/toastStore";
import { PERM } from "@/types";
import type { GroupAccessRow } from "./buildGroupAccessRows";
import {
  useCreateDrawerGrantMutation,
  useUpdateDrawerGrantMutation,
} from "./drawerGrantQueries";
import { useRenameDrawerGroupMutation } from "./drawerGroupQueries";
import { toGroupSummary } from "./toGroupSummary";
import { toNoAccessLevelId } from "./toNoAccessLevelId";

const props = defineProps<{
  drawerId: number;
  row: GroupAccessRow | null;
}>();

const isOpen = defineModel<boolean>("open", { required: true });

const toastStore = useToastStore();
const { data: permissionLevels } = useQuery(permissionLevelsQuery());
const renameGroup = useRenameDrawerGroupMutation();
const createGrant = useCreateDrawerGrantMutation();
const updateGrant = useUpdateDrawerGrantMutation();

const draftLabel = ref("");
const draftLevelId = ref<number | null>(null);

const permissionOptions = computed(() =>
  buildPermissionOptions(
    (permissionLevels.value ?? []).filter(
      (level) => level.level <= PERM.ORIGINALS
    )
  )
);

const isSaving = computed(
  (): boolean =>
    renameGroup.isPending.value ||
    createGrant.isPending.value ||
    updateGrant.isPending.value
);

const isDraftIncomplete = computed((): boolean => {
  if (draftLevelId.value === null) return true;
  return (
    Boolean(props.row?.group.ownedByCurrentUser) &&
    draftLabel.value.trim() === ""
  );
});

function toEditableLevelId(row: GroupAccessRow): number | null {
  return (
    row.permissionLevelId ?? toNoAccessLevelId(permissionLevels.value ?? [])
  );
}

function toLevelLabel(levelId: number): string {
  const option = permissionOptions.value.find(
    (candidate) => candidate.id === levelId
  );
  return option?.label ?? "";
}

watch(isOpen, (open) => {
  if (!open || !props.row) return;
  draftLabel.value = props.row.group.label;
  draftLevelId.value = toEditableLevelId(props.row);
});

function saveGroupName(row: GroupAccessRow, label: string): Promise<unknown> {
  return renameGroup.mutateAsync(
    { id: row.id, label },
    {
      onSuccess: () =>
        toastStore.success(`Group "${row.group.label}" renamed to "${label}".`),
      onError: (error) =>
        toastStore.error(
          `Failed to rename group "${row.group.label}": ${error.message}`,
          { title: "Rename Group Failed" }
        ),
    }
  );
}

// Save NOPERM as a grant, never a delete: the API
// refuses to delete a rule on another owner's group.
function saveAccess(row: GroupAccessRow, levelId: number): Promise<unknown> {
  const accessToasts = {
    onSuccess: () =>
      toastStore.success(
        `"${row.groupLabel}" access set to ${toLevelLabel(levelId)}.`
      ),
    onError: (error: Error) =>
      toastStore.error(
        `Failed to set access for "${row.groupLabel}": ${error.message}`,
        { title: "Save Access Failed" }
      ),
  };

  if (row.grantId === null) {
    return createGrant.mutateAsync(
      {
        drawerId: props.drawerId,
        drawerGroupId: row.id,
        permissionLevelId: levelId,
      },
      accessToasts
    );
  }

  return updateGrant.mutateAsync(
    { grantId: row.grantId, permissionLevelId: levelId },
    accessToasts
  );
}

async function save(): Promise<void> {
  const row = props.row;
  const label = draftLabel.value.trim();
  const levelId = draftLevelId.value;
  if (!row || levelId === null) return;

  const saves: Promise<unknown>[] = [];
  if (row.group.ownedByCurrentUser && label && label !== row.group.label) {
    saves.push(saveGroupName(row, label));
  }
  if (levelId !== toEditableLevelId(row)) {
    saves.push(saveAccess(row, levelId));
  }

  try {
    await Promise.all(saves);
    isOpen.value = false;
  } catch {
    // the mutations toast their own errors. Without
    // this catch the rejection is unhandled.
  }
}
</script>
