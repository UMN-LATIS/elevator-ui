<template>
  <section
    class="edit-widget-layout lg:grid lg:grid-cols-[auto,1fr] lg:gap-4 items-start border-b border-neutral-300 pt-2"
    :class="{
      'max-h-11 overflow-hidden': !isOpen,
      'cursor-pointer': !isOpen,
    }"
    @click="handleSectionClick">
    <button
      type="button"
      class="flex items-center gap-4 lg:w-48 xl:w-xs"
      @click.stop="toggleExpand">
      <ChevronDownIcon v-if="isOpen" />
      <ChevronRightIcon v-else />
      <span class="sr-only">
        {{ isOpen ? "Collapse" : "Expand" }}
      </span>
      <h2 class="text-lg font-bold">{{ widgetDef.label }}</h2>
    </button>
    <div
      :class="{
        'opacity-50': !isOpen,
      }">
      <slot name="widgetContents">
        <DragDropContainer :groupId="widgetDef.widgetId">
          <DragDropList
            :modelValue="widgetContents"
            :listId="widgetDef.widgetId"
            :showEmptyList="false"
            :handleClass="[
              'flex flex-col items-start py-2 px-1',
              {
                'opacity-0': !isOpen,
              },
            ]"
            listItemClass="bg-black/5 rounded-md my-1 pr-1 shadow"
            @update:modelValue="
              (widgetContents) => {
                $emit('update:widgetContents', widgetContents);
              }
            ">
            <template #item="{ item }">
              <div
                class="grid grid-cols-[auto,1fr,auto] gap-2 py-2 items-start">
                <div>
                  <Tooltip tip="Set as Primary">
                    <button
                      type="button"
                      class="flex items-center justify-center p-1 rounded-sm hover:bg-neutral-100"
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
                  </Tooltip>
                </div>
                <div class="py-1">
                  <slot name="fieldContents" :item="item" />
                </div>
                <div>
                  <button
                    :class="[
                      'text-neutral-900 hover:bg-red-50 hover:text-red-600 p-2 rounded-sm -mt-2 -mr-1',
                      {
                        'sr-only': !isOpen,
                      },
                    ]"
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
    </div>
  </section>
</template>
<script setup lang="ts" generic="T extends WithId<WidgetContent>">
import { DragDropContainer, DragDropList } from "@/components/DragDropList";
import Button from "@/components/Button/Button.vue";
import { PlusIcon, StarIcon } from "lucide-vue-next";
import { WidgetContent, WidgetProps, WithId } from "@/types";
import Tooltip from "@/components/Tooltip/Tooltip.vue";
import { ChevronDownIcon, ChevronRightIcon, XIcon } from "@/icons";

const props = defineProps<{
  widgetContents: T[];
  widgetDef: WidgetProps;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "add"): void;
  (e: "setPrimary", id: string): void;
  (e: "delete", id: string): void;
  (e: "update:widgetContents", widgetContents: T[]): void;
  (e: "update:isOpen", isOpen: boolean): void;
}>();

// Only expand the component if it's not already expanded
const handleSectionClick = () => {
  if (!props.isOpen) {
    emit("update:isOpen", true);
  }
};

const toggleExpand = (event: Event) => {
  // prevent the click of the collapse button from bubbling up
  // and triggering the handleSectionClick function
  // which would expand the component again
  event.stopPropagation();
  emit("update:isOpen", !props.isOpen);
};
</script>
<style>
.edit-widget-layout .drag-drop-list {
  --dnd-dragHandle-bg: transparent;
  --dnd-listItem-border: 1px solid transparent;

  & .drop-indicator.drop-indicator--top {
    top: -4px;
  }
  & .drop-indicator.drop-indicator--bottom {
    bottom: -3px;
  }
}
</style>
