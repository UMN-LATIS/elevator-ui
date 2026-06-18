<template>
  <div class="flex items-center justify-between">
    <p>Help text goes here about groups and how they work.</p>
    <Button variant="primary" @click="isCreateGroupOpen = true">
      Create Group
    </Button>
  </div>

  <AccordionRoot type="multiple" class="mt-4 flex flex-col gap-2">
    <AccordionItem
      v-for="groupType in groupTypes"
      :key="groupType.type"
      :value="groupType.type"
      class="rounded-md border border-outline-variant bg-surface-container">
      <AccordionHeader>
        <AccordionTrigger
          class="group flex w-full items-center gap-4 p-4 text-left">
          <ChevronRightIcon
            class="shrink-0 text-on-surface-variant transition-transform group-data-[state=open]:rotate-90" />
          <span class="text-lg font-bold">{{ groupType.label }}</span>
          <span
            class="ml-auto flex items-center gap-4 text-sm text-on-surface-variant">
            <span>{{ groupType.description }}</span>
            <!-- <span>1 grant</span> -->
          </span>
        </AccordionTrigger>
      </AccordionHeader>
      <AccordionContent
        class="border-t border-outline-variant p-4 bg-surface-container-lowest">
        <Button variant="danger">Delete Group</Button>
      </AccordionContent>
    </AccordionItem>
  </AccordionRoot>
  <Modal
    :isOpen="isCreateGroupOpen"
    label="New Group"
    class="max-w-md"
    @close="isCreateGroupOpen = false">
    <InputGroup v-model="newGroupForm.name" label="Name" />
    <SelectGroup v-model="newGroupForm.type" label="Type" :options="[]" />
  </Modal>
</template>
<script setup lang="ts">
import { reactive, ref } from "vue";
import Button from "@/components/Button/Button.vue";
import {
  AccordionRoot,
  AccordionTrigger,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
} from "reka-ui";
import ChevronRightIcon from "@/icons/ChevronRightIcon.vue";
import Modal from "@/components/Modal/Modal.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import { useGroupTypesQuery } from "@/queries/useGroupTypesQuery";

const { data: groupTypes } = useGroupTypesQuery();

const isCreateGroupOpen = ref(false);
const newGroupForm = reactive({
  name: "",
  type: "",
});
</script>
<style scoped></style>
