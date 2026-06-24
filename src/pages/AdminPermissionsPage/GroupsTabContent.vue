<template>
  <div class="flex items-center justify-between">
    <p>Help text goes here about groups and how they work.</p>
    <Button variant="primary" @click="openCreate">Create Group</Button>
  </div>

  <p v-if="isLoading" class="mt-4 text-on-surface-variant">Loading groups…</p>
  <p
    v-else-if="!groups?.length"
    class="mt-4 rounded-md border border-dashed border-outline-variant p-8 text-center text-on-surface-variant">
    No groups yet. Create one to get started.
  </p>

  <AccordionRoot
    v-else
    v-model="openGroupIds"
    type="multiple"
    class="mt-4 flex flex-col gap-2">
    <AccordionItem
      v-for="group in groups"
      :key="group.id"
      :value="String(group.id)"
      class="rounded-md border border-outline-variant bg-surface-container">
      <AccordionHeader
        class="group flex w-full items-center gap-4 p-4 text-left">
        <AccordionTrigger class="flex items-center gap-4">
          <ChevronRightIcon
            class="shrink-0 text-on-surface-variant transition-transform group-data-[state=open]:rotate-90" />
          <span class="text-lg font-bold">{{ group.label }}</span>
        </AccordionTrigger>
        <div
          class="ml-auto flex items-center text-sm text-on-surface-variant gap-2">
          <Chip
            v-if="group.type === GROUP_TYPES.USER"
            class="bg-secondary-container">
            {{ group.values.length }}
            {{ pluralize(group.values.length, "member") }}
          </Chip>
          <div v-else>{{ typeLabel(group.type) }}</div>
        </div>
        <DropDown
          alignment="right"
          :showChevron="false"
          labelClass="rounded-full hover:bg-surface-container-high">
          <template #label>
            <VerticalDotsIcon class="size-5" />
            <span class="sr-only">More actions</span>
          </template>
          <DropDownItem @click="openEdit(group)">Edit Group</DropDownItem>
          <DropDownItem @click="handleDelete(group)">
            <span class="text-error">Delete Group</span>
          </DropDownItem>
        </DropDown>
      </AccordionHeader>
      <AccordionContent
        class="border-t border-outline-variant p-4 bg-surface-container-lowest">
        <div class="flex justify-end">
          <DropDown
            alignment="right"
            :showChevron="false"
            labelClass="rounded-full hover:bg-surface-container-high">
            <template #label>
              <VerticalDotsIcon class="size-5" />
              <span class="sr-only">More actions</span>
            </template>
            <DropDownItem @click="openEdit(group)">Edit Group</DropDownItem>
            <DropDownItem @click="handleDelete(group)">
              <span class="text-error">Delete Group</span>
            </DropDownItem>
          </DropDown>
        </div>
        <GroupMemberManager
          v-if="group.type === GROUP_TYPES.USER"
          :group="group"
          :isOpen="openGroupIds.includes(String(group.id))"
          class="mt-2" />
      </AccordionContent>
    </AccordionItem>
  </AccordionRoot>

  <GroupFormModal
    :isOpen="isGroupModalOpen"
    :group="editingGroup"
    @close="closeGroupModal" />
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
import DropDown from "@/components/DropDown/DropDown.vue";
import DropDownItem from "@/components/DropDown/DropDownItem.vue";
import GroupFormModal from "./GroupFormModal.vue";
import GroupMemberManager from "./GroupMemberManager.vue";
import { useGroupsQuery } from "@/queries/useGroupsQuery";
import { useGroupTypesQuery } from "@/queries/useGroupTypesQuery";
import { GROUP_TYPES } from "@/types";
import type { GroupTypeValues, PermissionsGroup } from "@/types";
import { pluralize } from "@/helpers/pluralize.js";
import Chip from "@/components/Chip/Chip.vue";

const { data: groups, isLoading } = useGroupsQuery();
const { data: groupTypes } = useGroupTypesQuery();

const typeLabelByValue = computed(
  () => new Map(groupTypes.value?.map((type) => [type.type, type.label]) ?? [])
);

function typeLabel(type: GroupTypeValues) {
  return typeLabelByValue.value.get(type) ?? type;
}

// ids of the currently expanded accordion items, so each group fetches its
// members only when opened
const openGroupIds = ref<string[]>([]);

const editingGroup = ref<PermissionsGroup | null>(null);
const isGroupModalOpen = ref(false);

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

function handleDelete(_group: PermissionsGroup) {
  // TODO: delete is not wired yet. The backend deleteGroup returns 501.
}
</script>
<style scoped></style>
