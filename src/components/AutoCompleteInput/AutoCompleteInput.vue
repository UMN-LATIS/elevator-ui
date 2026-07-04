<template>
  <Input
    :id="id"
    ref="inputRef"
    :modelValue="modelValue"
    :placeholder="placeholder"
    :class="cn('bg-surface-container-low', inputClass)"
    :style="`anchor-name: ${anchorName}`"
    autocomplete="off"
    role="combobox"
    :aria-controls="`${id}-listbox`"
    :aria-expanded="isOpen"
    :aria-activedescendant="
      highlightedIndex >= 0 ? `${id}-option-${highlightedIndex}` : undefined
    "
    aria-autocomplete="list"
    @update:modelValue="handleUpdateSearchTerm"
    @focus="showListbox"
    @click="showListbox"
    @blur="$emit('blur')"
    @keydown="$emit('keydown', $event)"
    @keydown.enter="handleKeydownEnter"
    @keydown.up="handleKeydownUp"
    @keydown.down="handleKeydownDown" />

  <div
    :id="`${id}-listbox`"
    ref="listboxRef"
    popover="auto"
    class="autocomplete-listbox max-h-96 overflow-y-auto rounded-md border bg-inverse-surface text-inverse-on-surface shadow-md max-w-sm"
    role="listbox"
    :aria-labelledby="id"
    :style="`position-anchor: ${anchorName}`"
    @toggle="syncOpenState">
    <div
      v-if="needsMoreChars"
      class="p-4 text-sm text-inverse-on-surface-variant italic text-center">
      Type at least {{ minChars }}
      {{ minChars === 1 ? "character" : "characters" }} to see suggestions.
    </div>

    <div
      v-else-if="isLoading"
      class="flex items-center justify-center text-inverse-on-surface-variant italic gap-2 p-4">
      <SpinnerIcon class="size-4" />
      <span class="text-sm">Loading suggestions...</span>
    </div>

    <div
      v-else-if="items.length === 0"
      class="p-4 text-sm text-inverse-on-surface-variant italic text-center">
      No suggestions found.
    </div>

    <div v-else>
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
  </div>
</template>

<script setup lang="ts" generic="T">
import { computed, ref, useTemplateRef } from "vue";
import { Input } from "@/components/ui/input";
import { SpinnerIcon } from "@/icons";
import { CSSClass } from "@/types";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    items: T[];
    isLoading?: boolean;
    placeholder?: string;
    inputClass?: CSSClass;
    id?: string;
    blurOnSelect?: boolean;
    // number of chars required before a search is triggered
    minChars?: number;
    isItemDisabled?: (item: T) => boolean;
  }>(),
  {
    id: "",
    placeholder: "",
    inputClass: "",
    isLoading: false,
    blurOnSelect: true,
    minChars: 0,
    isItemDisabled: undefined,
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  select: [item: T];
  blur: [];
  keydown: [event: KeyboardEvent];
}>();

const inputRef = useTemplateRef("inputRef");
const listboxRef = useTemplateRef<HTMLDivElement>("listboxRef");

// CSS identifier that we put on the input for popover anchoring
const anchorName = computed(() => `--autocomplete-${props.id}`);

// Mirrors the popover's real state via its toggle event. The browser
// can close it without us (light dismiss), so this is a reflection of
// native state, not a driver of it. aria-expanded and the highlight
// reset hang off it.
const isOpen = ref(false);
const highlightedIndex = ref(-1);

function syncOpenState(event: ToggleEvent): void {
  isOpen.value = event.newState === "open";
  if (!isOpen.value) highlightedIndex.value = -1;
}

function showListbox(): void {
  const listbox = listboxRef.value;
  if (listbox && !listbox.matches(":popover-open")) listbox.showPopover();
}

function hideListbox(): void {
  const listbox = listboxRef.value;
  if (listbox && listbox.matches(":popover-open")) listbox.hidePopover();
}

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
  showListbox();
}

function handleKeydownDown(event: KeyboardEvent) {
  if (!hasNavigableOptions.value) return;
  event.preventDefault();
  showListbox();
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

function commitSelection(item: T) {
  if (isDisabled(item)) return;

  hideListbox();
  emit("select", item);

  if (props.blurOnSelect) {
    inputRef.value?.$el.blur();
  }
}
</script>

<style scoped>
/* reset popover defaults and pin listbox to anchor */
.autocomplete-listbox {
  position: fixed;
  inset: auto;
  margin: 0;
  padding: 0;
  top: calc(anchor(bottom) + 4px);
  left: anchor(left);
  width: anchor-size(width);
}
</style>
