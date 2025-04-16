<template>
  <EditWidgetLayout :label="widgetDef.label" class="edit-text-widget">
    <template #header-right>
      <Button variant="tertiary" @click="handleAddWidgetContent">
        <PlusIcon class="w-4 h-4" />
        <span class="ml-2">Add {{ widgetDef.label }}</span>
      </Button>
    </template>

    <DragDropContainer :groupId="widgetDef.widgetId">
      <!-- header -->
      <!-- <div class="table-row table-row--header">
        <div class="edit-text-widget-handle"></div>
        <div class="table-cell table-cell--sm">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div class="transform translate-y-[1px]">
                  <StarIcon class="size-3 fill-neutral-900" />
                  <span class="sr-only">Primary</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div class="text-sm">Set as Primary</div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div class="table-cell">{{ widgetDef.label }}</div>
        <div class="table-cell table-cell--sm"></div>
      </div> -->
      <!-- items -->
      <DragDropList
        :modelValue="widgetContents"
        :listId="widgetDef.widgetId"
        handleClass="edit-text-widget-handle"
        listItemClass="m-2">
        <template #item="{ item }">
          <div class="grid grid-cols-[auto,1fr,auto] gap-2 items-center">
            <div>
              <label>
                <input
                  :checked="item.isPrimary"
                  type="radio"
                  :name="`widget-${widgetDef.widgetId}-primary`"
                  @change="setPrimaryItem(item.id)" />
                <span class="sr-only">Primary</span>
              </label>
            </div>
            <div>
              <label :for="`${item.id}-input`" class="sr-only">
                {{ widgetDef.label }}
              </label>
              <Input
                :id="`${item.id}-input`"
                :modelValue="item.fieldContents"
                :placeholder="widgetDef.label"
                class="bg-black/5 border-none"
                @update:modelValue="
                  handleUpdateWidgetContentItem(item.id, $event)
                " />
            </div>
            <div>
              <button
                class="text-neutral-900 hover:bg-red-50 hover:text-red-600 p-2 rounded-sm"
                type="button"
                @click="console.log('Delete item')">
                <XIcon class="w-4 h-4" />
                <span class="sr-only">Delete</span>
              </button>
            </div>
          </div>
        </template>
      </DragDropList>
    </DragDropContainer>
  </EditWidgetLayout>
</template>
<script setup lang="ts">
import { reactive, watch } from "vue";
import * as Type from "@/types";
import { DragDropContainer, DragDropList } from "@/components/DragDropList";
import { Input } from "@/components/ui/input";
import Button from "@/components/Button/Button.vue";
import { PlusIcon, StarIcon } from "lucide-vue-next";
import EditWidgetLayout from "./EditWidgetLayout.vue";
import XIcon from "@/icons/XIcon.vue";
import { useEditAssetStore } from "@/stores/useEditAssetStore";
import { createDefaultWidgetContent } from "@/helpers/createDefaultWidgetContents";
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const props = defineProps<{
  widgetDef: Type.TextWidgetProps;
  widgetContents: Type.WithId<Type.TextWidgetContent>[];
}>();

const emit = defineEmits<{
  (
    e: "update:widgetContents",
    widgetContents: Type.WithId<Type.TextWidgetContent>[]
  ): void;
}>();

function setPrimaryItem(id: string) {
  const updatedWidgetContents = props.widgetContents.map((item) => {
    return {
      ...item,
      isPrimary: item.id === id,
    };
  });
  emit("update:widgetContents", updatedWidgetContents);
}

function handleAddWidgetContent() {
  const newItem = createDefaultWidgetContent(
    props.widgetDef
  ) as Type.WithId<Type.TextWidgetContent>;
  emit("update:widgetContents", [...props.widgetContents, newItem]);
}

function handleUpdateWidgetContentItem(id: string, fieldContents: string) {
  const updatedWidgetContents = props.widgetContents.map((item) => {
    if (item.id !== id) return item;
    return {
      ...item,
      fieldContents,
    };
  });
  emit("update:widgetContents", updatedWidgetContents);
}
</script>
<style scoped>
.table-row {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.table-row.table-row--header {
  @apply bg-neutral-100 text-xs font-bold text-neutral-900;
}

.table-cell.table-cell--sm {
  flex: initial; /* unset flex-1 */
  width: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.table-cell {
  flex: 1;
  padding: 0.5rem;
}

.table-row.table-row--header .table-cell {
  @apply py-1;
}
</style>
<style>
.edit-text-widget .edit-text-widget-handle {
  width: 2.5rem;
}
.edit-text-widget .drag-drop-list {
  --dnd-listItem-border: 0;
  --dnd-dragHandle-bg: transparent;
}
</style>
