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
        :class="
          cn(
            'block w-full rounded-md border border-outline-variant sm:text-sm py-2 bg-surface-container text-on-surface focus:bg-surface-bright px-4 placeholder:text-on-surface-muted',
            inputClass
          )
        "
        autocomplete="off"
        role="combobox"
        :aria-controls="`${id}-listbox`"
        :aria-expanded="isOpen"
        :aria-activedescendant="
          highlightedIndex >= 0 ? `${id}-option-${highlightedIndex}` : undefined
        "
        aria-autocomplete="list"
        @update:modelValue="handleUpdateSearchTerm"
        @focus="handleFocus"
        @click="openDropdown"
        @keydown.enter="handleKeydownEnter"
        @keydown.up="handleKeydownUp"
        @keydown.down="handleKeydownDown"
        @keydown.esc="handleKeydownEsc"
        @keydown="$emit('keydown', $event, { highlightedItem, modelValue })"
        @blur="$emit('blur')" />
    </PopoverAnchor>

    <PopoverPortal>
      <PopoverContent
        :id="`${id}-listbox`"
        class="w-[var(--reka-popover-trigger-width)] max-h-96 overflow-y-auto rounded-md border bg-surface-bright p-0 text-on-surface shadow-md z-10 max-w-sm"
        role="listbox"
        :aria-labelledby="id"
        align="start"
        :sideOffset="4">
        <div
          v-if="needsMoreChars"
          class="p-4 text-sm text-muted-foreground text-center">
          Type at least {{ minChars }}
          {{ minChars === 1 ? "character" : "characters" }} to see suggestions.
        </div>

        <div
          v-else-if="isLoading"
          class="flex items-center justify-center gap-2 p-4">
          <SpinnerIcon class="size-4" />
          <span class="text-sm">Loading suggestions...</span>
        </div>

        <div
          v-else-if="items.length === 0"
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
              itemClass?.(item),
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
import { cn } from "@/lib/utils";

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
    // The consumer's query threshold, which this component cannot know:
    // below it the dropdown explains that typing more starts the search,
    // instead of showing empty or stale results.
    minChars?: number;
    isItemDisabled?: (item: T) => boolean;
    // extra classes per option wrapper, e.g. to set a pinned row apart
    itemClass?: (item: T) => CSSClass;
  }>(),
  {
    id: "",
    placeholder: "",
    inputClass: "",
    isLoading: false,
    blurOnSelect: true,
    // Every consumer needs at least one character to search, so an empty
    // input shows the type-more hint rather than "No suggestions found."
    minChars: 1,
    isItemDisabled: undefined,
    itemClass: undefined,
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  keydown: [
    event: KeyboardEvent,
    context: { highlightedItem: T | null; modelValue: string }
  ];
  blur: [];
  focus: [];
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

const needsMoreChars = computed(() => {
  return props.minChars > 0 && props.modelValue.trim().length < props.minChars;
});

// Options render only when no state message (type-more, loading, empty)
// stands in for them, and only rendered options are keyboard-navigable.
const hasNavigableOptions = computed(() => {
  return !needsMoreChars.value && !props.isLoading && props.items.length > 0;
});

function handleUpdateSearchTerm(value: string) {
  emit("update:modelValue", value);
  highlightedIndex.value = -1;
  isOpen.value = true;
}

function openDropdown(): void {
  isOpen.value = true;
}

// Emitted so the parent can refresh suggestions for text already in the
// input, since update:modelValue only fires on typing.
function handleFocus(): void {
  isOpen.value = true;
  emit("focus");
}

function handleKeydownDown(event: KeyboardEvent) {
  if (!hasNavigableOptions.value) return;
  event.preventDefault();
  isOpen.value = true;
  highlightedIndex.value = Math.min(
    highlightedIndex.value + 1,
    props.items.length - 1
  );
}

function handleKeydownUp(event: KeyboardEvent) {
  if (!hasNavigableOptions.value) return;
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
