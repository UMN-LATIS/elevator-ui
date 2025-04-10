<template>
  <EditWidgetLayout :label="widgetDef.label" class="edit-text-widget">
    <div class="flex items-center justify-end mb-2">
      <Button variant="tertiary" @click="handleAddWidgetContent">
        <PlusIcon class="w-4 h-4" />
        <span class="ml-2">Add {{ widgetDef.label }}</span>
      </Button>
    </div>

    <DragDropContainer :groupId="widgetDef.widgetId">
      <!-- header -->
      <div class="table-row table-row--header">
        <div class="edit-text-widget-handle"></div>
        <div class="table-cell table-cell--sm">
          <Tooltip :hover="true" theme="dark" tooltip="Set as Primary">
            <div class="transform translate-y-[1px]">
              <StarIcon class="size-3 fill-neutral-900" />
              <span class="sr-only">Primary</span>
            </div>
          </Tooltip>
        </div>
        <div class="table-cell">{{ widgetDef.label }}</div>
        <div class="table-cell table-cell--sm"></div>
      </div>
      <!-- items -->
      <DragDropList
        v-model="localWidgetContents"
        :listId="widgetDef.widgetId"
        handleClass="edit-text-widget-handle">
        <template #item="{ item }">
          <div class="table-row">
            <div class="table-cell table-cell--sm">
              <label>
                <input
                  :checked="item.isPrimary"
                  type="radio"
                  :name="`widget-${widgetDef.widgetId}-primary`"
                  @change="setPrimaryItem(item.id)" />
                <span class="sr-only">Primary</span>
              </label>
            </div>
            <div class="table-cell">
              <label :for="`${item.id}-input`" class="sr-only">
                {{ widgetDef.label }}
              </label>
              <Input
                :id="`${item.id}-input`"
                v-model="item.fieldContents"
                :placeholder="widgetDef.label"
                class="bg-black/5 border-none" />
            </div>
            <div class="table-cell table-cell--sm">
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
import Tooltip from "@/components/Tooltip/Tooltip.vue";
import XIcon from "@/icons/XIcon.vue";
import { useEditAssetStore } from "@/stores/useEditAssetStore";
import { createDefaultWidgetContent } from "@/helpers/createDefaultWidgetContents";

const props = defineProps<{
  widgetDef: Type.TextWidgetProps;
  widgetContents: Type.WithId<Type.TextWidgetContent>[];
}>();

const localWidgetContents = reactive(props.widgetContents);
function setPrimaryItem(id: string) {
  localWidgetContents.forEach((item) => {
    item.isPrimary = item.id === id;
  });
}

const editAssetStore = useEditAssetStore();
watch(
  localWidgetContents,
  (newWidgetContents) => {
    editAssetStore.updateWidgetContents(
      props.widgetDef.fieldTitle,
      newWidgetContents
    );
  },
  { deep: true }
);

function handleAddWidgetContent() {
  const newItem = createDefaultWidgetContent(
    props.widgetDef
  ) as Type.WithId<Type.TextWidgetContent>;
  localWidgetContents.push(newItem);
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
