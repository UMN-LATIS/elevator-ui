<template>
  <Modal
    :isOpen="isOpen"
    :label="isEditing ? 'Edit Rule' : 'Create Rule'"
    class="max-w-md"
    @close="handleClose">
    <form @submit.prevent="handleSubmit">
      <SelectGroup
        v-model="form.collectionId"
        label="Collection"
        placeholder="Select a collection…"
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
          data-rule-new-group
          @click="isGroupModalOpen = true">
          New Group
        </Button>
      </div>

      <SelectGroup
        v-model="form.permissionLevelId"
        label="Permission"
        placeholder="Select a permission…"
        class="my-4"
        :options="permissionOptions" />

      <p
        v-if="grantAtDestination"
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
          {{ isEditing ? "Save Changes" : "Create Rule" }}
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
import {
  flattenCollections,
  normalizeAssetCollections,
} from "@/helpers/collectionHelpers";
import { groupsQuery } from "./groupQueries";
import {
  collectionGrantsQuery,
  instanceGrantsQuery,
  permissionLevelsQuery,
  useCreateRuleMutation,
  useUpdateRuleMutation,
} from "./ruleQueries";
import { ALL_COLLECTIONS_LABEL, PermissionRuleRow } from "./buildRuleRows";
import { GROUP_TYPES, isManageableGroup } from "@/types";
import type { PermissionsGroup, SelectOption } from "@/types";

const props = defineProps<{
  isOpen: boolean;
  // when present the modal edits this rule's level, otherwise it creates
  // a rule
  rule?: PermissionRuleRow | null;
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
// Both grant lists are already in the query cache from the Rules table.
const { data: instanceGrants } = useQuery(instanceGrantsQuery());
const { data: collectionGrants } = useQuery(collectionGrantsQuery());
const createRule = useCreateRuleMutation();
const updateRule = useUpdateRuleMutation();

const isEditing = computed(() => Boolean(props.rule));
const isPending = computed(
  () => createRule.isPending.value || updateRule.isPending.value
);

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

const isGroupModalOpen = ref(false);

// the group created mid-rule, held so closing the rule modal can offer
// the jump to member or entry setup
const createdGroup = ref<PermissionsGroup | null>(null);

// fill the form each time the modal opens, prefilling from the rule in
// edit mode and starting blank in create mode
watch(
  () => [props.isOpen, props.rule] as const,
  ([isOpen]) => {
    if (!isOpen) return;
    form.value = {
      collectionId: props.rule
        ? props.rule.collectionId ?? ALL_COLLECTIONS_ID
        : null,
      groupId: props.rule?.groupId ?? null,
      permissionLevelId: props.rule?.permissionLevelId ?? null,
    };
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
  const options: SelectOption<string | number>[] = [
    { id: ALL_COLLECTIONS_ID, label: ALL_COLLECTIONS_LABEL },
    ...flat.map((collection) => ({
      id: collection.id,
      label: collection.title,
    })),
  ];

  // An edited rule can sit on a collection missing from the nav list
  // (not browsable by this admin). Append it so the locked select still
  // shows the rule's collection instead of the placeholder.
  const ruleCollectionId = props.rule?.collectionId;
  if (
    ruleCollectionId != null &&
    !options.some((option) => option.id === ruleCollectionId)
  ) {
    options.push({
      id: ruleCollectionId,
      label: props.rule?.collectionLabel ?? `Collection ${ruleCollectionId}`,
    });
  }

  return options;
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

// The grant already sitting at the picked group + collection, if any,
// excluding the rule being edited (its own spot is not a conflict). A
// pair holds at most one grant, so saving over another one replaces
// it: the form warns, and submit updates that grant instead.
const grantAtDestination = computed(() => {
  const { collectionId, groupId } = form.value;
  if (collectionId === null || groupId === null) return null;

  const destinationScope =
    collectionId === ALL_COLLECTIONS_ID ? "instance" : "collection";
  const found =
    destinationScope === "instance"
      ? (instanceGrants.value ?? []).find((grant) => grant.groupId === groupId)
      : (collectionGrants.value ?? []).find(
          (grant) =>
            grant.collectionId === collectionId && grant.groupId === groupId
        );
  if (!found) return null;

  const isRuleBeingEdited =
    props.rule?.scope === destinationScope && props.rule?.grantId === found.id;
  return isRuleBeingEdited ? null : found;
});

const levelLabelToReplace = computed((): string | null => {
  const grant = grantAtDestination.value;
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

// Close only after a successful save settles, so the changed row is
// already in the table when it regains focus. A failure leaves the
// form open for a retry.
function closeWhenSaved(grant: unknown, error: Error | null): void {
  if (!error && grant) {
    offerGroupSetupToast();
    emit("close");
  }
}

function handleSubmit() {
  const { collectionId, groupId, permissionLevelId } = form.value;
  if (collectionId === null || groupId === null || permissionLevelId === null) {
    return;
  }

  const targetCollectionId =
    collectionId === ALL_COLLECTIONS_ID ? null : collectionId;

  if (props.rule) {
    updateRule.mutate(
      {
        original: {
          scope: props.rule.scope,
          grantId: props.rule.grantId,
          collectionId: props.rule.collectionId,
          groupId: props.rule.groupId,
        },
        collectionId: targetCollectionId,
        groupId,
        permissionLevelId,
        // moving onto an occupied pair replaces the grant there,
        // matching the warning above
        replaceGrantId: grantAtDestination.value?.id,
      },
      { onSettled: closeWhenSaved }
    );
  } else if (grantAtDestination.value) {
    // a pair holds at most one grant, so creating over an existing one
    // replaces it (matching the warning above) instead of 409ing
    const existing = grantAtDestination.value;
    updateRule.mutate(
      {
        original: {
          scope: targetCollectionId === null ? "instance" : "collection",
          grantId: existing.id,
          collectionId: targetCollectionId,
          groupId,
        },
        collectionId: targetCollectionId,
        groupId,
        permissionLevelId,
      },
      { onSettled: closeWhenSaved }
    );
  } else {
    createRule.mutate(
      {
        collectionId: targetCollectionId,
        groupId,
        permissionLevelId,
      },
      { onSettled: closeWhenSaved }
    );
  }
}
</script>
