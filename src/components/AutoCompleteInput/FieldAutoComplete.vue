<template>
  <AutoCompleteInput
    :id="id"
    :modelValue="modelValue"
    :items="suggestions"
    :isLoading="isLoadingSuggestions"
    :minChars="1"
    :placeholder="placeholder"
    :inputClass="inputClass"
    :blurOnSelect="blurOnSelect"
    @update:modelValue="$emit('update:modelValue', $event)"
    @select="$emit('select', $event)"
    @blur="$emit('blur')"
    @keydown="(event) => $emit('keydown', event)" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useDebounce } from "@vueuse/core";
import AutoCompleteInput from "./AutoCompleteInput.vue";
import { useAutocompleteQuery } from "@/queries/useAutocompleteQuery";
import { CSSClass } from "@/types";

// Autocomplete for a template field's existing values. Wraps the
// presentational AutoCompleteInput with the field-value query, debounced.
const props = withDefaults(
  defineProps<{
    modelValue: string;
    fieldTitle: string;
    templateId?: number | null;
    placeholder?: string;
    inputClass?: CSSClass;
    id?: string;
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

defineEmits<{
  "update:modelValue": [value: string];
  select: [value: string];
  blur: [];
  keydown: [event: KeyboardEvent];
}>();

const debouncedTerm = useDebounce(
  computed(() => props.modelValue),
  300
);

const { data, isFetching } = useAutocompleteQuery(
  () => props.fieldTitle,
  debouncedTerm,
  () => props.templateId ?? ""
);
const suggestions = computed(() => data.value ?? []);

// The debounce window counts as loading too: while the query waits for
// typing to settle, suggestions still reflect the previous term, and
// the dropdown must not present them as current.
const isLoadingSuggestions = computed(
  () =>
    isFetching.value || props.modelValue.trim() !== debouncedTerm.value.trim()
);
</script>
