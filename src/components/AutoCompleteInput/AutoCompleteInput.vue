<template>
  <PopoverRoot
    :open="isOpen"
    class="autocomplete-input"
    @update:open="isOpen = $event">
    <PopoverAnchor asChild>
      <div>
        <Input
          :id="id"
          ref="inputRef"
          :modelValue="searchTerm"
          :placeholder="placeholder"
          :class="inputClass"
          autocomplete="off"
          role="combobox"
          :aria-expanded="isOpen"
          :aria-activedescendant="
            highlightedIndex >= 0
              ? `${id}-option-${highlightedIndex}`
              : undefined
          "
          aria-autocomplete="list"
          @update:modelValue="handleUpdateSearchTerm"
          @blur="handleInputBlur"
          @keydown.enter="handleKeydownEnter"
          @keydown.up="handleKeydownUp"
          @keydown.down="handleKeydownDown"
          @keydown.esc="handleKeydownEsc"
          @keydown="
            $emit('keydown', $event, {
              searchTerm: searchTerm,
              highlightedSuggestion: highlightedSuggestion,
              modelValue: modelValue,
            })
          " />
      </div>
    </PopoverAnchor>

    <PopoverPortal>
      <PopoverContent
        class="w-[var(--reka-popover-trigger-width)] max-h-96 overflow-y-auto rounded-md border bg-popover p-0 text-popover-foreground shadow-md z-10"
        role="listbox"
        :aria-labelledby="id"
        align="start"
        :sideOffset="4">
        <!-- Loading state -->
        <div
          v-if="isLoadingSuggestions"
          class="flex items-center justify-center gap-2 p-2">
          <SpinnerIcon class="size-4" />
          <span class="text-sm">Loading suggestions...</span>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="showEmptyState"
          class="p-2 text-sm text-muted-foreground">
          No suggestions found.
        </div>

        <!-- Suggestions -->
        <div v-else class="max-h-[33dvh] overflow-y-auto">
          <div
            v-for="(suggestion, index) in suggestions"
            :id="`${id}-option-${index}`"
            :key="suggestion"
            role="option"
            :aria-selected="suggestion === modelValue"
            :class="[
              'relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
              index === highlightedIndex
                ? 'bg-blue-100 text-blue-700'
                : 'hover:bg-blue-100/50',
            ]"
            @click="commitSelection(suggestion)">
            <span>{{ suggestion }}</span>
          </div>
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { useDebounce } from "@vueuse/core";
import {
  PopoverRoot,
  PopoverContent,
  PopoverPortal,
  PopoverAnchor,
} from "reka-ui";
import { Input } from "@/components/ui/input";
import { SpinnerIcon } from "@/icons";
import { useAutocompleteQuery } from "@/queries/useAutocompleteQuery";
import { CSSClass } from "@/types";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    fieldTitle: string;
    templateId?: number | null;
    inputClass?: CSSClass;
    id: string;
    blurOnSelect?: boolean;
  }>(),
  {
    id: "",
    placeholder: "",
    inputClass: "",
    templateId: undefined,
    blurOnSelect: true,
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  keydown: [
    event: KeyboardEvent,
    {
      searchTerm: string;
      highlightedSuggestion: string | null;
      modelValue: string;
    }
  ];
}>();

// Component refs
const inputRef = useTemplateRef("inputRef");

// Autocomplete state
const searchTerm = ref(props.modelValue);
const isOpen = ref(false);
const highlightedIndex = ref(-1);

const highlightedSuggestion = computed((): string | null => {
  if (!suggestions.value.length || highlightedIndex.value <= 0) return null;
  return suggestions.value[highlightedIndex.value] ?? null;
});

// Debounced search for API calls
const debouncedSearchTerm = useDebounce(searchTerm, 300);

// Query for autocomplete suggestions
const { data: suggestions, isFetching } = useAutocompleteQuery(
  props.fieldTitle,
  debouncedSearchTerm,
  props.templateId || ""
);

const isTyping = computed(() => {
  const hasActiveInput = searchTerm.value.trim().length >= 1;
  return hasActiveInput && searchTerm.value !== debouncedSearchTerm.value;
});

const isLoadingSuggestions = computed(() => {
  return isTyping.value || isFetching.value;
});

const showEmptyState = computed(() => {
  return (
    searchTerm.value.trim().length >= 1 &&
    !isLoadingSuggestions.value &&
    suggestions.value.length === 0
  );
});

function handleUpdateSearchTerm(value: string) {
  searchTerm.value = value;
  highlightedIndex.value = -1; // Reset highlighting on new input

  // If the input is empty, close the dropdown
  if (value.trim().length === 0) {
    isOpen.value = false;
    return;
  }

  // Open dropdown when user is actively typing
  isOpen.value = true;
}

function handleInputBlur() {
  // Accept whatever was typed as the final value
  if (searchTerm.value !== props.modelValue) {
    commitSelection(searchTerm.value);
  }
}

function handleKeydownDown(event: KeyboardEvent) {
  const trimmedTerm = searchTerm.value.trim();
  // if no searchTerm or suggestions, we're done
  if (!trimmedTerm.length || !suggestions.value.length) {
    return;
  }

  event.preventDefault();

  // make sure dropdown is open
  isOpen.value = true;

  // advance highlight if possible
  highlightedIndex.value = Math.min(
    highlightedIndex.value + 1,
    suggestions.value.length - 1
  );
}

function handleKeydownUp(event: KeyboardEvent) {
  const trimmedTerm = searchTerm.value.trim();
  // if no searchTerm or suggestions, we're done
  if (!trimmedTerm.length || !suggestions.value.length) {
    return;
  }

  event.preventDefault();

  // move highlight up if possible
  highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1);
}

function handleKeydownEnter(event: KeyboardEvent) {
  const trimmedTerm = searchTerm.value.trim();
  // if no searchTerm or suggestions, we're done
  if (!trimmedTerm.length) {
    return;
  }

  event.preventDefault();

  // commit the highlighted suggestion or the current term
  commitSelection(highlightedSuggestion.value ?? trimmedTerm);
}

function handleKeydownEsc(event: KeyboardEvent) {
  // Close the dropdown and reset highlighting
  event.preventDefault();
  isOpen.value = false;
  highlightedIndex.value = -1;
}

async function commitSelection(selection: string) {
  // reset state
  isOpen.value = false;
  highlightedIndex.value = -1;

  // set search term and update the modelValue
  searchTerm.value = selection;
  emit("update:modelValue", selection);

  if (props.blurOnSelect) {
    inputRef.value?.$el.blur(); // Remove focus from input
  }
}

// Sync external modelValue changes to internal searchTerm
// e.g. if parent resets the value to empty string
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== searchTerm.value) {
      searchTerm.value = newValue;
    }
  }
);
</script>
