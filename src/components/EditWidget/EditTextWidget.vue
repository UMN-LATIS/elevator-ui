<template>
  <EditWidgetLayout :label="widget.label" class="edit-text-widget">
    <div class="flex items-center justify-end mb-2">
      <Button variant="tertiary" @click="addWidgetItem">
        <PlusIcon class="w-4 h-4" />
        <span class="ml-2">Add {{ widget.label }}</span>
      </Button>
    </div>

    <DragDropContainer :groupId="widget.widgetId">
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
        <div class="table-cell">{{ widget.label }}</div>
        <div class="table-cell table-cell--sm"></div>
      </div>
      <!-- items -->
      <DragDropList
        v-model="localWidgetContents"
        :listId="widget.widgetId"
        handleClass="edit-text-widget-handle">
        <template #item="{ item }">
          <div class="table-row">
            <div class="table-cell table-cell--sm">
              <label>
                <input
                  v-model="item.content.isPrimary"
                  type="radio"
                  name="primary" />
                <span class="sr-only">Primary</span>
              </label>
            </div>
            <div class="table-cell">
              <label :for="`${item.id}-input`" class="sr-only">
                {{ widget.label }}
              </label>
              <Input
                :id="`${item.id}-input`"
                v-model="item.content.fieldContents"
                :placeholder="widget.label"
                class="bg-black/5 border-none" />
            </div>
            <div class="table-cell table-cell--sm">
              <button
                class="text-neutral-900 hover:bg-red-50 hover:text-red-600 p-2 rounded-sm"
                type="button"
                @click="deleteWidgetItem(item.id)">
                <XIcon class="w-4 h-4" />
                <span class="sr-only">Delete</span>
              </button>
              <!-- <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="tertiary" size="sm">
                    <VerticalDotsIcon class="w-4 h-4" />
                    <span class="sr-only">More</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Delete</DropdownMenuItem>
                  <DropdownMenuItem>Billing</DropdownMenuItem>
                  <DropdownMenuItem>Team</DropdownMenuItem>
                  <DropdownMenuItem>Subscription</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> -->
            </div>
          </div>
        </template>
      </DragDropList>
    </DragDropContainer>
  </EditWidgetLayout>
</template>
<script setup lang="ts">
import { onMounted, reactive } from "vue";
import * as Type from "@/types";
import { getWidgetContents } from "@/helpers/displayUtils";
import { DragDropContainer, DragDropList } from "@/components/DragDropList";
import { Input } from "../ui/input";
import Button from "../Button/Button.vue";
import { PlusIcon, StarIcon, TrashIcon } from "lucide-vue-next";
import { VerticalDotsIcon } from "@/icons";
import EditWidgetLayout from "./EditWidgetLayout.vue";
import Tooltip from "@/components/Tooltip/Tooltip.vue";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "../ui/dropdown-menu";
import XIcon from "@/icons/XIcon.vue";

const props = defineProps<{
  widget: Type.TextTemplateWidgetProps;
  asset: Type.Asset;
}>();

type WidgetContentWithId = {
  id: string;
  content: Type.TextWidgetContent;
};

const localWidgetContents = reactive<WidgetContentWithId[]>([]);

onMounted(() => {
  const contents = getWidgetContents({
    asset: props.asset,
    widget: props.widget,
  }) as Type.TextWidgetContent[];

  const contentsWithId = contents.map((content) => ({
    id: crypto.randomUUID(),
    content,
  }));

  localWidgetContents.push(...contentsWithId);
});

function addWidgetItem() {
  const newContent: Type.TextWidgetContent = {
    fieldContents: "",
    isPrimary: false,
  };
  const newContentWithId = {
    id: crypto.randomUUID(),
    content: newContent,
  };
  localWidgetContents.push(newContentWithId);
}

function deleteWidgetItem(id: string) {
  const index = localWidgetContents.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error("Cannot deleteWidgetItem: item not found");
  }
  localWidgetContents.splice(index, 1);
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
