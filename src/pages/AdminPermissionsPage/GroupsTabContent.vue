<template>
  <div>
    <div class="flex justify-between items-center gap-x-8 gap-y-4 flex-wrap">
      <p class="text-sm flex-1">
        Create a group to manage permissions for a set of users.
      </p>
      <div class="flex gap-2 items-center flex-wrap">
        <InputGroup
          v-model="searchGroupText"
          label="Search Groups"
          placeholder="Search groups"
          :labelHidden="true"
          class="max-w-sm"
          type="search"
          :disabled="isLoading">
          <template #prepend>
            <FilterIcon class="size-4 text-on-surface-variant" />
          </template>
        </InputGroup>
        <Button variant="primary" class="whitespace-nowrap" @click="openCreate">
          Create Group
        </Button>
      </div>
    </div>

    <div
      v-if="isLoading"
      class="my-4 flex flex-col border-y border-outline-variant">
      <div
        v-for="row in SKELETON_ROW_COUNT"
        :key="`skeleton-${row}`"
        class="flex items-center gap-4 border-b border-outline-variant p-4 last:border-b-0">
        <Skeleton width="1rem" height="1rem" />
        <Skeleton width="30%" height="1rem" />
        <Skeleton width="5rem" height="1.5rem" class="ml-auto rounded-full" />
      </div>
    </div>
    <p
      v-else-if="!filteredGroups?.length"
      class="mt-4 rounded-md border border-dashed border-outline-variant p-8 text-center text-on-surface-variant">
      No groups yet. Create one to get started.
    </p>

    <AccordionRoot v-else v-model="openGroupIds" type="multiple" class="">
      <AccordionItem
        v-for="group in filteredGroups"
        :key="group.id"
        v-slot="{ open: isPanelOpen }"
        :value="String(group.id)"
        class="rounded-md overflow-hidden data-[state=open]:shadow-md data-[state=open]:border data-[state=open]:border-outline-variant data-[state=open]:my-4">
        <AccordionHeader class="group flex w-full items-center gap-4">
          <AccordionTrigger
            :data-group-trigger="group.id"
            class="flex items-center gap-2 text-sm font-medium text-left flex-1 p-4 data-[state=open]:font-bold focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary">
            <ChevronRightIcon
              class="shrink-0 text-on-surface-variant transition-transform group-data-[state=open]:rotate-90 !size-4" />
            {{ group.label || group.type }}
          </AccordionTrigger>
          <div
            class="ml-auto flex items-center text-sm text-on-surface-variant gap-1">
            <Chip
              v-if="group.type === GROUP_TYPES.USER"
              class="bg-secondary-container">
              {{ group.entries_count }}
              {{ pluralize(group.entries_count, "member") }}
            </Chip>
            <div v-else>
              {{ groupTypesMap.get(group.type)?.label ?? group.type }}
            </div>
            <DropDown
              alignment="right"
              :showChevron="false"
              labelClass="rounded-full hover:bg-surface-container-highest justify-self-end">
              <template #label>
                <VerticalDotsIcon class="size-5" />
                <span class="sr-only">More actions</span>
              </template>
              <DropDownItem is="button" @click="openEdit(group)">
                Edit Group
              </DropDownItem>
              <DropDownItem is="button" @click="handleDelete(group)">
                <span class="text-error">Delete Group</span>
              </DropDownItem>
            </DropDown>
          </div>
        </AccordionHeader>
        <AccordionContent class="p-4 pl-16 text-sm text-on-surface-variant">
          <p v-if="getGroupDescription(group)" class="mb-4">
            {{ getGroupDescription(group) }}
          </p>
          <GroupMemberManager
            v-if="group.type === GROUP_TYPES.USER"
            :group="group"
            :isOpen="isPanelOpen" />
          <GroupEntriesManager
            v-else-if="isAuthHelperGroupType(group)"
            :group="group"
            :isOpen="isPanelOpen" />
        </AccordionContent>
      </AccordionItem>
    </AccordionRoot>

    <GroupFormModal
      :isOpen="isGroupModalOpen"
      :group="editingGroup"
      @close="closeGroupModal"
      @created="handleCreated" />

    <ConfirmModal
      :isOpen="Boolean(groupPendingDelete)"
      title="Delete Group"
      type="danger"
      confirmLabel="Delete"
      @close="groupPendingDelete = null"
      @confirm="confirmDelete">
      <p>
        Are you sure you want to delete group
        <b>{{ groupPendingDelete?.label || groupPendingDelete?.type }}</b>
        ? This action cannot be undone.
      </p>
    </ConfirmModal>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import Button from "@/components/Button/Button.vue";
import {
  AccordionRoot,
  AccordionTrigger,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
} from "reka-ui";
import ChevronRightIcon from "@/icons/ChevronRightIcon.vue";
import VerticalDotsIcon from "@/icons/VerticalDotsIcon.vue";
import Skeleton from "@/components/Skeleton/Skeleton.vue";
import DropDown from "@/components/DropDown/DropDown.vue";
import DropDownItem from "@/components/DropDown/DropDownItem.vue";
import GroupFormModal from "./GroupFormModal.vue";
import GroupMemberManager from "./GroupMemberManager.vue";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal.vue";
import { useQuery } from "@tanstack/vue-query";
import {
  groupsQuery,
  groupTypesQuery,
  useDeleteGroupMutation,
} from "./groupQueries";
import { GROUP_TYPES } from "@/types";
import type {
  GroupTypeValues,
  GroupTypeDetails,
  PermissionsGroup,
} from "@/types";
import { pluralize } from "@/helpers/pluralize.js";
import { tryFocus } from "@/helpers/tryFocus";
import Chip from "@/components/Chip/Chip.vue";
import { useToastStore } from "@/stores/toastStore";
import GroupEntriesManager from "./GroupEntriesManager.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import { FilterIcon } from "lucide-vue-next";

// Placeholder rows shown while the group list loads.
const SKELETON_ROW_COUNT = 3;

const toastStore = useToastStore();
const { data: groups, isLoading } = useQuery(groupsQuery());
const { data: groupTypes } = useQuery(groupTypesQuery());
const { mutate: deleteGroup } = useDeleteGroupMutation();

const searchGroupText = ref("");

const byAlphaNumeric = (a: PermissionsGroup, b: PermissionsGroup) => {
  const labelA = a.label || a.type;
  const labelB = b.label || b.type;
  return labelA.localeCompare(labelB, undefined, { numeric: true });
};
const filteredGroups = computed(
  () =>
    groups.value
      ?.filter(
        (g) =>
          g.label
            ?.toLowerCase()
            .includes(searchGroupText.value.toLowerCase()) ||
          g.type.toLowerCase().includes(searchGroupText.value.toLowerCase())
      )
      .toSorted(byAlphaNumeric) ?? []
);

const groupTypesMap = computed((): Map<GroupTypeValues, GroupTypeDetails> => {
  const entries = groupTypes.value?.map((g) => [g.type, g] as const) ?? [];
  return new Map(entries);
});

// ids of the currently expanded accordion items, so each group fetches its
// members only when opened
const openGroupIds = ref<string[]>([]);

// Open a freshly created group and move focus into it: a User group opens
// its add-member form so the admin can start adding people, other types land
// on the accordion trigger and scroll into view. The row, its open content,
// and the button mount across several frames, so tryFocus retries until
// focus lands rather than guessing a single tick.
async function handleCreated(group: PermissionsGroup) {
  const groupId = String(group.id);
  if (!openGroupIds.value.includes(groupId)) {
    openGroupIds.value = [...openGroupIds.value, groupId];
  }

  const isUserGroup = group.type === GROUP_TYPES.USER;
  const selector = isUserGroup
    ? `[data-group-add-member="${group.id}"]`
    : `[data-group-trigger="${group.id}"]`;

  try {
    const focused = await tryFocus(selector);
    if (isUserGroup) {
      // clicking the Add Member row opens the form, which then moves
      // focus into its search field
      focused.click();
    } else {
      focused.scrollIntoView({ block: "nearest" });
    }
  } catch (error) {
    console.warn(`Could not focus new ${group.type} group`, error);
  }
}

const editingGroup = ref<PermissionsGroup | null>(null);
const isGroupModalOpen = ref(false);

function getGroupDescription(group: PermissionsGroup): string {
  return groupTypesMap.value.get(group.type)?.description ?? "";
}

// Auth-helper types are defined per campus by the backend's AuthHelper
// classes, so the UI can only recognize them as "not one of the built-in
// GROUP_TYPES". The backend rejects entry writes on other types anyway.
function isAuthHelperGroupType(group: PermissionsGroup): boolean {
  const builtInTypes: GroupTypeValues[] = Object.values(GROUP_TYPES);
  return !builtInTypes.includes(group.type);
}

function openCreate() {
  editingGroup.value = null;
  isGroupModalOpen.value = true;
}

function openEdit(group: PermissionsGroup) {
  editingGroup.value = group;
  isGroupModalOpen.value = true;
}

function closeGroupModal() {
  isGroupModalOpen.value = false;
}

// the group awaiting delete confirmation; also drives the modal's open state
const groupPendingDelete = ref<PermissionsGroup | null>(null);

function handleDelete(group: PermissionsGroup) {
  groupPendingDelete.value = group;
}

function confirmDelete() {
  const group = groupPendingDelete.value;
  if (!group) return;
  deleteGroup(group.id, {
    onSuccess: () =>
      toastStore.addToast({
        message: `Group "${group.label || group.type}" deleted.`,
        variant: "success",
      }),
    onError: (error) =>
      toastStore.addToast({
        title: "Delete Group Failed",
        message: `Failed to delete group "${group.label || group.type}": ${
          error.message
        }`,
        variant: "error",
      }),
  });
  groupPendingDelete.value = null;
}
</script>
<style scoped></style>
