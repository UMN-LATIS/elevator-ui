<template>
  <div class="flex items-center justify-between">
    <p>Help text goes here about groups and how they work.</p>
    <Button variant="primary" @click="isCreateGroupOpen = true">
      Create Group
    </Button>
  </div>

  <p v-if="isLoading" class="mt-4 text-on-surface-variant">Loading groups…</p>
  <p
    v-else-if="!groups?.length"
    class="mt-4 rounded-md border border-dashed border-outline-variant p-8 text-center text-on-surface-variant">
    No groups yet. Create one to get started.
  </p>

  <AccordionRoot v-else type="multiple" class="mt-4 flex flex-col gap-2">
    <AccordionItem
      v-for="group in groups"
      :key="group.id"
      :value="String(group.id)"
      class="rounded-md border border-outline-variant bg-surface-container">
      <AccordionHeader>
        <AccordionTrigger
          class="group flex w-full items-center gap-4 p-4 text-left">
          <ChevronRightIcon
            class="shrink-0 text-on-surface-variant transition-transform group-data-[state=open]:rotate-90" />
          <span class="text-lg font-bold">{{ group.label }}</span>
          <span
            class="ml-auto flex items-center gap-4 text-sm text-on-surface-variant">
            <span>{{ typeLabel(group.type) }}</span>
            <span v-if="group.type === GROUP_TYPES.USER">
              {{ group.values.length }}
              {{ group.values.length === 1 ? "member" : "members" }}
            </span>
          </span>
        </AccordionTrigger>
      </AccordionHeader>
      <AccordionContent
        class="border-t border-outline-variant p-4 bg-surface-container-lowest">
        <Button variant="danger">Delete Group</Button>
      </AccordionContent>
    </AccordionItem>
  </AccordionRoot>

  <CreateGroupModal
    :isOpen="isCreateGroupOpen"
    @close="isCreateGroupOpen = false" />
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
import CreateGroupModal from "./CreateGroupModal.vue";
import { useGroupsQuery } from "@/queries/useGroupsQuery";
import { useGroupTypesQuery } from "@/queries/useGroupTypesQuery";
import { GROUP_TYPES } from "@/types";
import type { GroupTypeValues } from "@/types";

const { data: groups, isLoading } = useGroupsQuery();
const { data: groupTypes } = useGroupTypesQuery();

const typeLabelByValue = computed(
  () => new Map(groupTypes.value?.map((type) => [type.type, type.label]) ?? [])
);

function typeLabel(type: GroupTypeValues) {
  return typeLabelByValue.value.get(type) ?? type;
}

const isCreateGroupOpen = ref(false);
</script>
<style scoped></style>
