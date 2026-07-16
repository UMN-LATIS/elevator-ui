<template>
  <Modal
    :isOpen="isOpen"
    label="Create Rule"
    class="max-w-md"
    @close="handleClose">
    <form @submit.prevent="handleSubmit">
      <SelectGroup
        v-model="form.drawerId"
        label="Drawer"
        placeholder="Select a drawer…"
        :options="drawerOptions" />

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
          on this drawer. Saving will replace it.
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
          <LoaderCircleIcon v-if="isPending" class="size-4 animate-spin" />
          {{ isPending ? "Creating…" : "Create Rule" }}
        </Button>
      </div>
    </form>
  </Modal>

  <!-- Rendered after the rule modal so its teleported layer stacks on top. -->
  <GroupFormModal
    :isOpen="isGroupModalOpen"
    @close="isGroupModalOpen = false"
    @created="handleGroupCreated" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useQuery } from "@tanstack/vue-query";
import { LoaderCircleIcon, TriangleAlertIcon } from "lucide-vue-next";
import Modal from "@/components/Modal/Modal.vue";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import Button from "@/components/Button/Button.vue";
import PermissionSelect from "@/components/PermissionSelect/PermissionSelect.vue";
import { buildPermissionOptions } from "@/components/PermissionSelect/buildPermissionOptions";
import { useToastStore } from "@/stores/toastStore";
import GroupFormModal from "./GroupFormModal.vue";
import { toDrawerTitle } from "./toDrawerTitle";
import {
  drawerGroupsQuery,
  manageableDrawersQuery,
} from "./drawerGroupQueries";
import {
  drawerGrantsQuery,
  useCreateDrawerGrantMutation,
  useUpdateDrawerGrantMutation,
} from "./drawerGrantQueries";
import { permissionLevelsQuery } from "@/queries/permissionLevelsQuery";
import { GROUP_TYPES, isManageableGroup } from "@/types";
import type { DrawerGrant, PermissionsGroup, SelectOption } from "@/types";

const props = defineProps<{
  isOpen: boolean;
}>();
const emit = defineEmits<{
  (e: "close"): void;
}>();

// Every list here is already in the query cache from the Rules table.
const { data: drawers } = useQuery(manageableDrawersQuery());
const { data: groups } = useQuery(drawerGroupsQuery());
const { data: permissionLevels } = useQuery(permissionLevelsQuery());
const { data: grants } = useQuery(drawerGrantsQuery());
const createGrant = useCreateDrawerGrantMutation();
const updateGrant = useUpdateDrawerGrantMutation();

const isPending = computed(
  () => createGrant.isPending.value || updateGrant.isPending.value
);

type RuleForm = {
  drawerId: number | null;
  groupId: number | null;
  permissionLevelId: number | null;
};

function blankForm(): RuleForm {
  return { drawerId: null, groupId: null, permissionLevelId: null };
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
    urlText: `Add ${noun}`,
  });
}

const drawerOptions = computed((): SelectOption<number>[] =>
  (drawers.value ?? []).map((drawer) => ({
    id: drawer.id,
    label: toDrawerTitle(drawer),
  }))
);

// A rule can only name a group the caller owns, which is exactly what
// the drawer groups list holds.
const groupOptions = computed((): SelectOption<number>[] =>
  (groups.value ?? []).map((group) => ({
    id: group.id,
    label: group.label || group.type,
  }))
);

const permissionOptions = computed(() =>
  buildPermissionOptions(permissionLevels.value ?? [])
);

const canSubmit = computed(
  (): boolean =>
    form.value.drawerId !== null &&
    form.value.groupId !== null &&
    form.value.permissionLevelId !== null
);

// The grant already on the picked drawer and group, which saving will
// replace. A pair holds at most one grant.
const grantBeingOverwritten = computed((): DrawerGrant | null => {
  const { drawerId, groupId } = form.value;
  if (drawerId === null || groupId === null) return null;

  const grantForPair = (grants.value ?? []).find(
    (grant) => grant.drawerId === drawerId && grant.group?.id === groupId
  );
  return grantForPair ?? null;
});

const levelLabelToReplace = computed((): string | null => {
  const grant = grantBeingOverwritten.value;
  if (!grant) return null;
  const level = (permissionLevels.value ?? []).find(
    (candidate) => candidate.id === grant.permissionLevelId
  );
  return level?.label ?? null;
});

function handleClose() {
  // Esc reaches both stacked modals, so the rule modal stays open while
  // the group modal is the one on top.
  if (isGroupModalOpen.value) return;
  offerGroupSetupToast();
  emit("close");
}

// Close only after a successful save settles, so the new row is already
// in the table when it regains focus. A failure leaves the form open for
// a retry.
function closeWhenSaved(grant: DrawerGrant | undefined, error: Error | null) {
  if (!error && grant) {
    offerGroupSetupToast();
    emit("close");
  }
}

function handleSubmit() {
  const { drawerId, groupId, permissionLevelId } = form.value;
  if (drawerId === null || groupId === null || permissionLevelId === null) {
    return;
  }

  const existingGrant = grantBeingOverwritten.value;

  // creating onto an occupied pair replaces the grant there, matching the
  // "Saving will replace it" warning
  if (existingGrant) {
    updateGrant.mutate(
      { grantId: existingGrant.id, permissionLevelId },
      { onSettled: closeWhenSaved }
    );
    return;
  }

  createGrant.mutate(
    { drawerId, drawerGroupId: groupId, permissionLevelId },
    { onSettled: closeWhenSaved }
  );
}
</script>
