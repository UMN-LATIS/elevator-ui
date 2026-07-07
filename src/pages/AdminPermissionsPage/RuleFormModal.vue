<template>
  <Modal
    :isOpen="isOpen"
    label="Create Rule"
    class="max-w-md"
    @close="handleClose">
    <form @submit.prevent="handleSubmit">
      <SelectGroup
        v-model="form.collectionId"
        label="Collection"
        placeholder="Select a collection…"
        :options="collectionOptions" />

      <SelectGroup
        v-model="form.groupId"
        label="Group"
        placeholder="Select a group…"
        class="my-4"
        :options="groupOptions" />

      <SelectGroup
        v-model="form.permissionLevelId"
        label="Permission"
        placeholder="Select a permission…"
        class="my-4"
        :options="permissionOptions" />

      <div class="flex items-center justify-end gap-2">
        <Button variant="tertiary" type="button" @click="handleClose">
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          :disabled="!canSubmit || createRule.isPending.value">
          Create Rule
        </Button>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import Modal from "@/components/Modal/Modal.vue";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import Button from "@/components/Button/Button.vue";
import { useQuery } from "@tanstack/vue-query";
import { useInstanceQuery } from "@/queries/useInstanceQuery";
import {
  flattenCollections,
  normalizeAssetCollections,
} from "@/helpers/collectionHelpers";
import { groupsQuery } from "./groupQueries";
import { permissionLevelsQuery, useCreateRuleMutation } from "./ruleQueries";
import { ALL_COLLECTIONS_LABEL } from "./buildRuleRows";
import type { SelectOption } from "@/types";

const props = defineProps<{
  isOpen: boolean;
}>();
const emit = defineEmits<{
  (e: "close"): void;
}>();

// The select stores numbers for collections; "All Collections" needs a
// non-numeric sentinel so SelectGroup passes it through as a string.
const ALL_COLLECTIONS_ID = "all";

const { data: groups } = useQuery(groupsQuery());
const { data: permissionLevels } = useQuery(permissionLevelsQuery());
const { data: instanceNav } = useInstanceQuery();
const createRule = useCreateRuleMutation();

type RuleForm = {
  collectionId: number | typeof ALL_COLLECTIONS_ID | null;
  groupId: number | null;
  permissionLevelId: number | null;
};

const form = ref<RuleForm>({
  collectionId: null,
  groupId: null,
  permissionLevelId: null,
});

// reset the form each time the modal opens
watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen) return;
    form.value = {
      collectionId: null,
      groupId: null,
      permissionLevelId: null,
    };
  },
  { immediate: true }
);

const collectionOptions = computed((): SelectOption<string | number>[] => {
  const flat = flattenCollections(
    normalizeAssetCollections(instanceNav.value?.collections ?? [])
  );
  return [
    { id: ALL_COLLECTIONS_ID, label: ALL_COLLECTIONS_LABEL },
    ...flat.map((collection) => ({
      id: collection.id,
      label: collection.title,
    })),
  ];
});

const groupOptions = computed((): SelectOption<number>[] =>
  (groups.value ?? []).map((group) => ({
    id: group.id,
    label: group.label || group.type,
  }))
);

// Level 0 (noperm) is omitted: grants only add access under max-merge
// resolution, so a level-0 rule does nothing.
const permissionOptions = computed((): SelectOption<number>[] =>
  (permissionLevels.value ?? [])
    .filter((level) => level.level > 0)
    .map((level) => ({ id: level.id, label: level.label }))
);

const canSubmit = computed(
  (): boolean =>
    form.value.collectionId !== null &&
    form.value.groupId !== null &&
    form.value.permissionLevelId !== null
);

function handleClose() {
  emit("close");
}

function handleSubmit() {
  const { collectionId, groupId, permissionLevelId } = form.value;
  if (collectionId === null || groupId === null || permissionLevelId === null) {
    return;
  }

  createRule.mutate(
    {
      collectionId: collectionId === ALL_COLLECTIONS_ID ? null : collectionId,
      groupId,
      permissionLevelId,
    },
    {
      // wait for the list invalidation to settle before closing so the
      // new row is already there when the table regains focus
      onSettled: (grant, error) => {
        if (!error && grant) emit("close");
      },
    }
  );
}
</script>
