<template>
  <FormDialog
    v-model:open="isOpen"
    title="Edit Group"
    :description="row ? toGroupSummary(row.group, row.typeLabel) : undefined"
    :isSubmitting="isSaving"
    :isSubmitDisabled="draftLabel.trim() === '' || draftLevelId === null"
    @submit="save">
    <InputGroup v-model="draftLabel" label="Group name" />
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
import { toGroupSummary } from "../DrawerManagementPage/toGroupSummary";
import { useUpdateGroupMutation } from "./groupQueries";
import { useSaveRuleMutation } from "./ruleQueries";
import type { PermissionRow } from "./buildPermissionsPageRows";

const props = defineProps<{
  row: PermissionRow | null;
}>();

const isOpen = defineModel<boolean>("open", { required: true });

const { data: permissionLevels } = useQuery(permissionLevelsQuery());
const updateGroup = useUpdateGroupMutation();
const saveRule = useSaveRuleMutation();

const draftLabel = ref("");
const draftLevelId = ref<number | null>(null);

const permissionOptions = computed(() =>
  buildPermissionOptions(permissionLevels.value ?? [])
);

const isSaving = computed(
  (): boolean => updateGroup.isPending.value || saveRule.isPending.value
);

watch(isOpen, (open) => {
  if (!open || !props.row) return;
  draftLabel.value = props.row.group.label;
  draftLevelId.value = props.row.permissionLevelId;
});

async function save(): Promise<void> {
  const row = props.row;
  const label = draftLabel.value.trim();
  const levelId = draftLevelId.value;
  if (!row || label === "" || levelId === null) return;

  const saves: Promise<unknown>[] = [];
  if (label !== row.group.label) {
    saves.push(
      updateGroup.mutateAsync({
        id: row.group.id,
        payload: { label, type: row.group.type },
      })
    );
  }
  if (levelId !== row.permissionLevelId) {
    saves.push(
      saveRule.mutateAsync({
        kind: "update",
        grantId: row.grantId,
        rule: {
          collectionId: row.collectionId,
          groupId: row.group.id,
          permissionLevelId: levelId,
        },
      })
    );
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
