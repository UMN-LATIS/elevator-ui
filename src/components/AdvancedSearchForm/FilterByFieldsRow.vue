<template>
  <div class="flex items-baseline gap-2">
    <Button
      class="text-xs w-6 !ml-0"
      :class="{
        invisible: rowIndex === 0,
        hidden: searchStore.totalFieldFilterCount === 1,
      }"
      variant="tertiary"
      type="button"
      @click="handleSearchOperatorClick"
    >
      {{ searchOperator }}
    </Button>
    <select
      class="rounded-md w-1/4 text-sm"
      :value="currentField.id"
      @change="handleFieldChange"
    >
      <option
        v-for="supportedField in supportedSpecificFields"
        :key="supportedField.id"
        :value="supportedField.id"
      >
        {{ supportedField.label }}
      </option>
    </select>

    <InputGroup
      v-if="['text', 'date', 'text area'].includes(currentField.type)"
      :id="filter.id"
      class="flex-1 text-sm"
      inputClass="!bg-white !border !border-neutral-200"
      :label="currentField.label"
      :modelValue="filter.value"
      :labelHidden="true"
      :placeholder="`Type your ${currentField.label.toLowerCase()}...`"
      @update:modelValue="handleFilterValueChange"
    />

    <SelectFieldOptions
      v-if="['select', 'tag list'].includes(currentField.type)"
      class="flex-1 text-sm"
      :filter="filter"
    />

    <CheckboxFieldOptions
      v-if="currentField.type === 'checkbox'"
      class="flex-1 text-sm"
      :filter="(filter as SearchableCheckboxFieldFilter)"
    />

    <MultiSelectFieldOptions
      v-if="currentField.type === 'multiselect'"
      class="flex-1 text-sm"
      :filter="filter"
    />

    <label
      class="text-xs font-bold uppercase text-center cursor-pointer leading-none"
      :class="{
        'text-blue-600': filter.isFuzzy,
        'text-neutral-300': !filter.isFuzzy,
      }"
    >
      <input
        class="sr-only"
        type="checkbox"
        :checked="filter.isFuzzy"
        @change="handleIsFuzzyChange"
      />
      <span class="md:hidden">FZY</span>
      <span class="hidden md:inline-block" aria-label="Fuzzy Search"
        >Fuzzy</span
      >
    </label>

    <button
      type="button"
      class="self-start p-2 mt-[0.1rem]"
      @click="handleRemoveFilter"
    >
      <CircleXIcon class="w-5 h-5" />
    </button>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import Button from "@/components/Button/Button.vue";
import { CircleXIcon } from "@/icons";
import { useInstanceStore } from "@/stores/instanceStore";
import { useSearchStore } from "@/stores/searchStore";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import SelectFieldOptions from "./SelectFieldOptions.vue";
import CheckboxFieldOptions from "./CheckboxFieldOptions.vue";
import MultiSelectFieldOptions from "./MultiSelectFieldOptions.vue";
import type {
  SearchableSpecificFieldFilter,
  SearchableSpecificField,
  SearchableCheckboxFieldFilter,
} from "@/types";

const props = defineProps<{
  filter: SearchableSpecificFieldFilter;
  rowIndex: number;
}>();

const instanceStore = useInstanceStore();
const searchStore = useSearchStore();

const currentField = computed((): SearchableSpecificField => {
  const field = instanceStore.getSearchableField(props.filter.fieldId);

  if (!field) {
    throw new Error(
      `Could not find searchable field with id ${props.filter.fieldId}`
    );
  }
  return field;
});

const supportedSpecificFields = computed(() => {
  return instanceStore.searchableFields.filter((field) =>
    searchStore.supportedSpecificFieldTypes.includes(field.type)
  );
});

const searchOperator = computed(
  () => searchStore.filterBy.searchableFieldsOperator
);

function handleSearchOperatorClick() {
  const currentOperator = searchStore.filterBy.searchableFieldsOperator;
  const newOperator = currentOperator === "AND" ? "OR" : "AND";
  searchStore.updateSearchableFieldsOperator(newOperator);
}

function handleFieldChange(event: Event) {
  const oldFieldId = props.filter.fieldId;
  const newFieldId = (event.target as HTMLSelectElement).value;

  // if the new field is the same as the current field, we're done
  if (newFieldId === oldFieldId) {
    return;
  }
  searchStore.updateFilterFieldId(props.filter.id, newFieldId);

  // now we might need to reset the value of the filter
  const oldField = instanceStore.getSearchableField(oldFieldId);
  const newField = instanceStore.getSearchableField(newFieldId);

  // if both the old and the new fields are text, leave the value in place
  if (oldField?.type === "text" && newField?.type === "text") {
    return;
  }

  // otherwise reset the value
  searchStore.updateSearchableFieldFilterValue(props.filter.id, "");
}

function handleFilterValueChange(value: string) {
  searchStore.updateSearchableFieldFilterValue(props.filter.id, value);
}

function handleIsFuzzyChange(event: Event) {
  searchStore.updateSearchableFieldFilterIsFuzzy(
    props.filter.id,
    (event.target as HTMLInputElement).checked
  );
}

function handleRemoveFilter() {
  searchStore.removeSearchableFieldFilter(props.filter.id);
}
</script>
<style scoped>
select {
  background-image: url("data:image/svg+xml, %3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='%23111' %3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E");
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1rem;
  padding-right: 2.5rem;
  border-color: #e5e5e5;
}
</style>
