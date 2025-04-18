<template>
  <section
    class="edit-widget-layout lg:grid lg:grid-cols-[1fr,3fr] lg:gap-4 items-start border-b border-neutral-300 pt-2"
    :class="{
      'max-h-11 overflow-hidden': !isExpanded,
      'cursor-pointer': !isExpanded,
    }"
    @click="handleSectionClick">
    <button
      type="button"
      class="flex items-center gap-4"
      @click.stop="toggleExpand">
      <ChevronDownIcon v-if="isExpanded" />
      <ChevronRightIcon v-else />
      <span class="sr-only">
        {{ isExpanded ? "Collapse" : "Expand" }}
      </span>
      <h2 class="text-lg font-bold">{{ widgetDef.label }}</h2>
    </button>
    <slot name="widgetContents">
      <DragDropContainer :groupId="widgetDef.widgetId">
        <DragDropList
          :modelValue="widgetContents"
          :listId="widgetDef.widgetId"
          :showEmptyList="false"
          handleClass="edit-text-widget-handle"
          listItemClass=""
          @update:modelValue="
            (widgetContents) => {
              $emit('update:widgetContents', widgetContents);
            }
          ">
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
              <div class="py-2">
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
          <template #footer>
            <div class="flex justify-center">
              <Button variant="tertiary" @click="$emit('add')">
                <PlusIcon class="w-4 h-4" />
                {{ widgetDef.label }}
              </Button>
            </div>
          </template>
        </DragDropList>
      </DragDropContainer>
    </slot>
  </section>
</template>
<script setup lang="ts" generic="T extends WithId<WidgetContent>">
import { DragDropContainer, DragDropList } from "@/components/DragDropList";
import Button from "@/components/Button/Button.vue";
import { PlusIcon, StarIcon } from "lucide-vue-next";
import { WidgetContent, WidgetProps, WithId } from "@/types";
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronDownIcon, ChevronRightIcon, XIcon } from "@/icons";
import { ref } from "vue";

defineProps<{
  widgetContents: T[];
  widgetDef: WidgetProps;
}>();

defineEmits<{
  (e: "add"): void;
  (e: "setPrimary", id: string): void;
  (e: "delete", id: string): void;
  (e: "update:widgetContents", widgetContents: T[]): void;
}>();

const isExpanded = ref(false);

// Only expand the component if it's not already expanded
const handleSectionClick = () => {
  if (!isExpanded.value) {
    isExpanded.value = true;
  }
};

const toggleExpand = (event: Event) => {
  // prevent the click of the collapse button from bubbling up
  // and triggering the handleSectionClick function
  // which would expand the component again
  event.stopPropagation();
  isExpanded.value = !isExpanded.value;
};
</script>
<style>
.edit-widget-layout .drag-drop-list {
  --dnd-dragHandle-bg: transparent;
  --dnd-listItem-border: 1px solid transparent;
}
</style>
