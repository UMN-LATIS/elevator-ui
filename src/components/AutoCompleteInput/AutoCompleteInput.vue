<template>
  <Combobox
    :modelValue="modelValue"
    @update:modelValue="(val) => emit('update:modelValue', String(val))">
    <ComboboxAnchor asChild>
      <ComboboxInput
        :id="id"
        v-model="searchTerm"
        :placeholder="placeholder"
        :class="inputClass"
        :displayValue="(val) => String(val)"
        @blur="handleBlur" />
    </ComboboxAnchor>

    <ComboboxList
      class="z-50 max-h-96 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md">
      <ComboboxEmpty>
        <div
          v-if="isLoadingSuggestions"
          class="flex items-center justify-center gap-2 p-2">
          <SpinnerIcon class="size-4" />
          <span class="text-sm">Loading suggestions...</span>
        </div>
        <div
          v-else-if="showEmptyState"
          class="p-2 text-sm text-muted-foreground">
          No suggestions found.
        </div>
      </ComboboxEmpty>

      <div class="max-h-[33dvh] overflow-y-auto">
        <ComboboxItem
          v-for="suggestion in suggestions"
          :key="suggestion"
          :value="suggestion"
          class="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">
          <span>{{ suggestion }}</span>
          <ComboboxItemIndicator class="ml-auto">
            <Check class="h-4 w-4" />
          </ComboboxItemIndicator>
        </ComboboxItem>
      </div>
    </ComboboxList>
  </Combobox>
</template>

<script setup lang="ts">
import { computed, watch, ref } from "vue";
import { useDebounce } from "@vueuse/core";
import {
  Combobox,
  ComboboxAnchor,
  ComboboxInput,
  ComboboxList,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxItemIndicator,
} from "@/components/ui/combobox";
import { Check } from "lucide-vue-next";
import { SpinnerIcon } from "@/icons";
import { useAutocompleteQuery } from "@/queries/useAutocompleteQuery";
import { CSSClass } from "@/types";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    fieldTitle: string;
    templateId?: string | number;
    inputClass?: CSSClass;
    id: string;
  }>(),
  {
    id: "",
    placeholder: "",
    inputClass: "",
    templateId: "",
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

// Autocomplete state
const searchTerm = ref(props.modelValue);

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

// Watch for external modelValue changes
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue === searchTerm.value) return;
    searchTerm.value = newValue;
  }
);

// if they leave the field, accept whatever was typed
// as the final value
function handleBlur() {
  if (searchTerm.value === props.modelValue) return;
  emit("update:modelValue", searchTerm.value);
}
</script>
