<template>
  <BaseFilterRow :rowIndex="rowIndex" @remove="handleRemoveFilter">
    <template #label>
      <select
        class="rounded-md text-sm filter-row__name w-full border-neutral-200 bg-transparent"
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
    </template>

    <InputGroup
      v-if="['text', 'date', 'text area'].includes(currentField.type)"
      :id="filter.id"
      class="text-sm"
      inputClass="!bg-white !border !border-neutral-200 placeholder:capitalize"
      :label="currentField.label"
      :modelValue="filter.value"
      :labelHidden="true"
      :placeholder="currentField.label"
      @update:modelValue="handleFilterValueChange"
    />

    <SelectFieldOptions
      v-if="['select', 'tag list'].includes(currentField.type)"
      class="w-full text-sm"
      :filter="filter"
    />

    <CheckboxFieldOptions
      v-if="currentField.type === 'checkbox'"
      class="w-full text-sm"
      :filter="(filter as SearchableCheckboxFieldFilter)"
    />

    <MultiSelectFieldOptions
      v-if="currentField.type === 'multiselect'"
      class="w-full text-sm"
      :filter="filter"
    />
    <template #fuzzy>
      <label
        class="text-xs font-bold uppercase text-center cursor-pointer leading-none block"
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
        <span aria-label="Fuzzy Search">Fuzzy</span>
      </label>
    </template>
  </BaseFilterRow>
</template>
<script setup lang="ts">
import { computed } from "vue";
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
import BaseFilterRow from "./BaseFilterRow.vue";

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
<style scoped></style>
