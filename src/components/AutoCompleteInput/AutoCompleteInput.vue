<template>
  <PopoverRoot
    :open="isOpen"
    class="autocomplete-input"
    @update:open="isOpen = $event">
    <PopoverAnchor asChild>
      <Input
        :id="id"
        ref="inputRef"
        :modelValue="modelValue"
        :placeholder="placeholder"
        :class="inputClass"
        autocomplete="off"
        role="combobox"
        :aria-expanded="isOpen"
        :aria-activedescendant="
          highlightedIndex >= 0 ? `${id}-option-${highlightedIndex}` : undefined
        "
        aria-autocomplete="list"
        @update:modelValue="handleUpdateSearchTerm"
        @keydown.enter="handleKeydownEnter"
        @keydown.up="handleKeydownUp"
        @keydown.down="handleKeydownDown"
        @keydown.esc="handleKeydownEsc"
        @keydown="$emit('keydown', $event, { highlightedItem, modelValue })"
        @blur="$emit('blur')" />
    </PopoverAnchor>

    <PopoverPortal>
      <PopoverContent
        class="w-[var(--reka-popover-trigger-width)] max-h-96 overflow-y-auto rounded-md border bg-inverse-surface p-0 text-inverse-on-surface shadow-md z-10 max-w-sm"
        role="listbox"
        :aria-labelledby="id"
        align="start"
        :sideOffset="4">
        <div
          v-if="isLoading"
          class="flex items-center justify-center gap-2 p-4">
          <SpinnerIcon class="size-4" />
          <span class="text-sm">Loading suggestions...</span>
        </div>

        <div
          v-else-if="showEmptyState"
          class="p-4 text-sm text-muted-foreground text-center">
          No suggestions found.
        </div>

        <div v-else class="max-h-[33dvh] overflow-y-auto">
          <div
            v-for="(item, index) in items"
            :id="`${id}-option-${index}`"
            :key="index"
            role="option"
            :aria-selected="index === highlightedIndex"
            :aria-disabled="isDisabled(item)"
            :class="[
              'relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-primary-container hover:text-on-primary-container',
              index === highlightedIndex && 'bg-primary text-on-primary',
              isDisabled(item) && 'cursor-not-allowed opacity-50',
            ]"
            @mousedown.prevent="commitSelection(item)">
            <slot
              name="option"
              :item="item"
              :highlighted="index === highlightedIndex"
              :disabled="isDisabled(item)">
              {{ item }}
            </slot>
          </div>
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<script setup lang="ts" generic="T">
import { computed, ref, useTemplateRef } from "vue";
import {
  PopoverRoot,
  PopoverContent,
  PopoverPortal,
  PopoverAnchor,
} from "reka-ui";
import { Input } from "@/components/ui/input";
import { SpinnerIcon } from "@/icons";
import { CSSClass } from "@/types";

// Presentational autocomplete. The parent owns the data: it passes `items`
// and `isLoading`, renders each item with the #option slot, and reacts to
// `select`. A disabled item can be shown but not chosen.
const props = withDefaults(
  defineProps<{
    modelValue: string;
    items: T[];
    isLoading?: boolean;
    placeholder?: string;
    inputClass?: CSSClass;
    id?: string;
    blurOnSelect?: boolean;
    isItemDisabled?: (item: T) => boolean;
  }>(),
  {
    id: "",
    placeholder: "",
    inputClass: "",
    isLoading: false,
    blurOnSelect: true,
    isItemDisabled: undefined,
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  keydown: [
    event: KeyboardEvent,
    context: { highlightedItem: T | null; modelValue: string }
  ];
  blur: [];
  select: [item: T];
}>();

const inputRef = useTemplateRef("inputRef");

const isOpen = ref(false);
const highlightedIndex = ref(-1);

const highlightedItem = computed((): T | null => {
  if (!props.items.length || highlightedIndex.value < 0) return null;
  return props.items[highlightedIndex.value] ?? null;
});

function isDisabled(item: T): boolean {
  return props.isItemDisabled?.(item) ?? false;
}

const showEmptyState = computed(() => {
  return (
    props.modelValue.trim().length >= 1 &&
    !props.isLoading &&
    props.items.length === 0
  );
});

function handleUpdateSearchTerm(value: string) {
  emit("update:modelValue", value);
  highlightedIndex.value = -1;

  if (value.trim().length === 0) {
    isOpen.value = false;
    return;
  }
  isOpen.value = true;
}

function handleKeydownDown(event: KeyboardEvent) {
  if (!props.modelValue.trim().length || !props.items.length) return;
  event.preventDefault();
  isOpen.value = true;
  highlightedIndex.value = Math.min(
    highlightedIndex.value + 1,
    props.items.length - 1
  );
}

function handleKeydownUp(event: KeyboardEvent) {
  if (!props.modelValue.trim().length || !props.items.length) return;
  event.preventDefault();
  highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1);
}

function handleKeydownEnter(event: KeyboardEvent) {
  const item = highlightedItem.value;
  if (item === null) return;
  event.preventDefault();
  commitSelection(item);
}

function handleKeydownEsc(event: KeyboardEvent) {
  event.preventDefault();
  isOpen.value = false;
  highlightedIndex.value = -1;
}

function commitSelection(item: T) {
  if (isDisabled(item)) return;

  isOpen.value = false;
  highlightedIndex.value = -1;
  emit("select", item);

  if (props.blurOnSelect) {
    inputRef.value?.$el.blur();
  }
}
</script>
