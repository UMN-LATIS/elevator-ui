<template>
  <Modal
    :isOpen="isOpen"
    label="Create Rule"
    class="max-w-md"
    @close="handleClose">
    <form @submit.prevent="handleSubmit">
      <SelectGroup v-model="form.scope" label="Scope" :options="scopeOptions" />

      <SelectGroup
        v-if="form.scope === 'collection'"
        v-model="form.collectionId"
        label="Collection"
        placeholder="Select a collection…"
        class="mt-4"
        :options="collectionOptions" />

      <div class="my-4 flex items-end gap-2">
        <SelectGroup
          v-model="form.groupId"
          label="Group"
          placeholder="Select a group…"
          class="flex-1"
          :options="groupOptions" />
        <Button
          variant="secondary"
          type="button"
          class="whitespace-nowrap text-sm py-2"
          @click="isGroupModalOpen = true">
          New Group
        </Button>
      </div>

      <PermissionSelect
        v-model="form.permissionLevelId"
        label="Permission"
        placeholder="Select a permission…"
        class="my-4"
        :options="permissionOptions" />

      <p
        v-if="grantBeingOverwritten"
        role="alert"
        class="my-4 flex items-center gap-2 rounded-md bg-warning-container px-3 py-2 text-sm text-on-warning-container">
        <TriangleAlertIcon class="size-4 shrink-0" />
        <span>
          This group already has
          <b>{{ levelLabelToReplace ?? "a permission" }}</b>
          on this collection. Saving will replace it.
        </span>
      </p>

      <div class="flex items-center justify-end gap-2">
        <Button variant="tertiary" type="button" @click="handleClose">
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          :disabled="!canSubmit || isPending">
          Create Rule
        </Button>
      </div>
    </form>
  </Modal>

  <!-- Renders after the rule modal so its teleported layer stacks on top. -->
  <GroupFormModal
    :isOpen="isGroupModalOpen"
    @close="isGroupModalOpen = false"
    @created="handleGroupCreated" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import Modal from "@/components/Modal/Modal.vue";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import Button from "@/components/Button/Button.vue";
import { TriangleAlertIcon } from "lucide-vue-next";
import { useQuery } from "@tanstack/vue-query";
import { useInstanceQuery } from "@/queries/useInstanceQuery";
import { useToastStore } from "@/stores/toastStore";
import GroupFormModal from "./GroupFormModal.vue";
import PermissionSelect from "./PermissionSelect.vue";
import {
  flattenCollections,
  normalizeAssetCollections,
} from "@/helpers/collectionHelpers";
import { groupsQuery } from "./groupQueries";
import {
  collectionGrantsQuery,
  instanceGrantsQuery,
  permissionLevelsQuery,
  useSaveRuleMutation,
} from "./ruleQueries";
import type { RuleScope } from "./ruleQueries";
import { buildPermissionOptions } from "./buildPermissionOptions";
import { GROUP_TYPES, isManageableGroup } from "@/types";
import type {
  CollectionGrant,
  InstanceGrant,
  PermissionsGroup,
  SelectOption,
} from "@/types";

const props = defineProps<{
  isOpen: boolean;
}>();
const emit = defineEmits<{
  (e: "close"): void;
}>();

const scopeOptions: SelectOption<string>[] = [
  { id: "instance", label: "Instance" },
  { id: "collection", label: "Collection" },
];

const { data: groups } = useQuery(groupsQuery());
const { data: permissionLevels } = useQuery(permissionLevelsQuery());
const { data: instanceNav } = useInstanceQuery();
// Both grant lists are already in the query cache from the Rules table.
const { data: instanceGrants } = useQuery(instanceGrantsQuery());
const { data: collectionGrants } = useQuery(collectionGrantsQuery());
const saveRule = useSaveRuleMutation();

const isPending = saveRule.isPending;

type RuleForm = {
  scope: RuleScope;
  collectionId: number | null;
  groupId: number | null;
  permissionLevelId: number | null;
};

function blankForm(): RuleForm {
  return {
    scope: "instance",
    collectionId: null,
    groupId: null,
    permissionLevelId: null,
  };
}

const form = ref<RuleForm>(blankForm());

const isGroupModalOpen = ref(false);

// the group created mid-rule, held so closing the rule modal can offer
// the jump to member or entry setup
const createdGroup = ref<PermissionsGroup | null>(null);

// start each open from a blank form
watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen) return;
    form.value = blankForm();
    createdGroup.value = null;
  },
  { immediate: true }
);

// GroupFormModal emits this after the groups list refetch settles, so
// the new id is already among groupOptions when it becomes the pick.
function handleGroupCreated(group: PermissionsGroup): void {
  createdGroup.value = group;
  form.value.groupId = group.id;
}

const router = useRouter();
const toastStore = useToastStore();

// A group created mid-rule has no members or entries yet, and that setup
// lives on the Groups tab. Offer the jump once the rule modal is out of
// the way, via the ?group deep link the Groups tab already handles.
function offerGroupSetupToast(): void {
  const group = createdGroup.value;
  createdGroup.value = null;
  // global types hold no members or entries, nothing to set up
  if (!group || !isManageableGroup(group)) return;

  const noun = group.type === GROUP_TYPES.USER ? "members" : "entries";
  toastStore.addToast({
    message: `"${group.label}" has no ${noun} yet.`,
    // longer than the default so it outlives the rule-created toast
    duration: 8000,
    url: router.resolve({ query: { tab: "groups", group: String(group.id) } })
      .fullPath,
    urlText: noun === "members" ? "Add members" : "Add entries",
  });
}

const collectionOptions = computed((): SelectOption<string | number>[] => {
  const flat = flattenCollections(
    normalizeAssetCollections(instanceNav.value?.collections ?? [])
  );
  return flat.map((collection) => ({
    id: collection.id,
    label: collection.title,
  }));
});

const groupOptions = computed((): SelectOption<number>[] =>
  (groups.value ?? []).map((group) => ({
    id: group.id,
    label: group.label || group.type,
  }))
);

const permissionOptions = computed(() =>
  buildPermissionOptions(permissionLevels.value ?? [])
);

const canSubmit = computed((): boolean => {
  // Instance scope covers every collection, so no collection pick is needed.
  const hasCollection =
    form.value.scope === "instance" || form.value.collectionId !== null;
  return (
    hasCollection &&
    form.value.groupId !== null &&
    form.value.permissionLevelId !== null
  );
});

// The grant already at the picked pair, which saving will replace.
// A pair holds at most one grant.
const grantBeingOverwritten = computed(
  (): InstanceGrant | CollectionGrant | null => {
    const { scope, collectionId, groupId } = form.value;
    if (groupId === null) return null;

    // instance permissions
    if (scope === "instance") {
      const instanceGrantForGroup = (instanceGrants.value ?? []).find(
        (grant) => grant.groupId === groupId
      );
      return instanceGrantForGroup ?? null;
    }

    // collection permissions
    if (collectionId === null) return null;
    const collectionGrantForPair = (collectionGrants.value ?? []).find(
      (grant) =>
        grant.collectionId === collectionId && grant.groupId === groupId
    );
    return collectionGrantForPair ?? null;
  }
);

const levelLabelToReplace = computed((): string | null => {
  const grant = grantBeingOverwritten.value;
  if (!grant) return null;
  const level = (permissionLevels.value ?? []).find(
    (candidate) => candidate.id === grant.permissionLevelId
  );
  return level?.label ?? null;
});

function handleClose() {
  // Esc reaches both stacked modals, so the rule modal holds still
  // while the group modal is the one on top.
  if (isGroupModalOpen.value) return;
  offerGroupSetupToast();
  emit("close");
}

// Close only after a successful save settles, so the new row is already
// in the table when it regains focus. A failure leaves the form open for
// a retry.
function closeWhenSaved(grant: unknown, error: Error | null): void {
  if (!error && grant) {
    offerGroupSetupToast();
    emit("close");
  }
}

function handleSubmit() {
  const { scope, collectionId, groupId, permissionLevelId } = form.value;
  if (groupId === null || permissionLevelId === null) return;
  if (scope === "collection" && collectionId === null) return;

  const rule = {
    collectionId: scope === "instance" ? null : collectionId,
    groupId,
    permissionLevelId,
  };

  if (grantBeingOverwritten.value) {
    // creating onto an occupied pair replaces the grant there,
    // matching the warning above
    saveRule.mutate(
      { kind: "update", grantId: grantBeingOverwritten.value.id, rule },
      { onSettled: closeWhenSaved }
    );
  } else {
    saveRule.mutate({ kind: "create", rule }, { onSettled: closeWhenSaved });
  }
}
</script>
