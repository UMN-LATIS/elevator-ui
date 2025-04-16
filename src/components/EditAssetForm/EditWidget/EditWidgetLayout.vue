<template>
  <section class="edit-widget-layout py-4">
    <header class="flex justify-between items-center gap-4">
      <h2 class="text-lg font-bold">{{ widgetDef.label }}</h2>
      <Button variant="tertiary" @click="$emit('add')">
        <PlusIcon class="w-4 h-4" />
        <span class="ml-2">Add</span>
      </Button>
    </header>
    <DragDropContainer :groupId="widgetDef.widgetId">
      <DragDropList
        :modelValue="widgetContents"
        :listId="widgetDef.widgetId"
        handleClass="edit-text-widget-handle"
        listItemClass="my-2">
        <template #item="{ item }">
          <div class="grid grid-cols-[auto,1fr,auto] gap-2 items-center pl-2">
            <div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      class="flex items-center justify-center p-1.5 rounded-sm hover:bg-neutral-100"
                      @click="$emit('setPrimary', item.id)">
                      <StarIcon
                        class="w-4 h-4"
                        :class="
                          item.isPrimary
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-neutral-400'
                        " />
                      <span class="sr-only">Set as Primary</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Set as Primary</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div>
              <slot name="fieldContents" :item="item" />
            </div>
            <div>
              <button
                class="text-neutral-900 hover:bg-red-50 hover:text-red-600 p-2 rounded-sm"
                type="button"
                @click="$emit('delete', item.id)">
                <XIcon class="w-4 h-4" />
                <span class="sr-only">Delete</span>
              </button>
            </div>
          </div>
        </template>
      </DragDropList>
    </DragDropContainer>
  </section>
</template>
<script setup lang="ts" generic="T extends WithId<WidgetContent>">
import { DragDropContainer, DragDropList } from "@/components/DragDropList";
import XIcon from "@/icons/XIcon.vue";
import Button from "@/components/Button/Button.vue";
import { PlusIcon, StarIcon } from "lucide-vue-next";
import { WidgetContent, WidgetProps, WithId } from "@/types";
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

defineProps<{
  widgetContents: T[];
  widgetDef: WidgetProps;
}>();

defineEmits<{
  (e: "add"): void;
  (e: "setPrimary", id: string): void;
  (e: "delete", id: string): void;
}>();
</script>
<style>
.edit-widget-layout .drag-drop-list {
  --dnd-listItem-border: 0;
  --dnd-dragHandle-bg: transparent;
}
</style>
