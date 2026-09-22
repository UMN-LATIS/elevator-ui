<template>
  <select
    v-if="values && values.length > 0"
    :value="selectedValue"
    class="rounded-md w-full border-neutral-200"
    @change="handleSelectChange">
    <option v-for="value in values" :key="value" :value="value">
      {{ value === "" ? "-" : value }}
    </option>
  </select>

  <InputGroup
    v-else-if="values"
    :id="filter.id"
    class="text-sm"
    inputClass="!bg-white !border !border-neutral-200 placeholder:capitalize"
    :label="field.label"
    :modelValue="filter.value"
    :labelHidden="true"
    :placeholder="field.label"
    @update:modelValue="handleTextChange" />
</template>
<script setup lang="ts">
import api from "@/api";
import { SearchableSpecificFieldFilter, SearchableTagListField } from "@/types";
import { ref, watch, computed } from "vue";
import { useSearchStore } from "@/stores/searchStore";
import { useInstanceStore } from "@/stores/instanceStore";
import InputGroup from "@/components/InputGroup/InputGroup.vue";

const props = defineProps<{
  filter: SearchableSpecificFieldFilter;
}>();

const searchStore = useSearchStore();
const instanceStore = useInstanceStore();

const field = computed((): SearchableTagListField => {
  const field = instanceStore.getSearchableField<SearchableTagListField>(
    props.filter.fieldId
  );

  if (!field) {
    throw new Error(
      `Could not find searchable field with id ${props.filter.fieldId}`
    );
  }
  return field;
});

const values = ref<string[] | null>(null);
const selectedValue = ref<string>(props.filter.value);

function handleSelectChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  searchStore.updateSearchableFieldFilterValue(props.filter.id, target.value);
}

function handleTextChange(value: string) {
  searchStore.updateSearchableFieldFilterValue(props.filter.id, value);
}

watch(
  field,
  async () => {
    values.value = null;
    const loadedValues = await api.getSearchableTagListFieldValues(field.value);
    values.value = loadedValues;

    const isTextInput = loadedValues.length === 0;
    if (isTextInput || loadedValues.includes(props.filter.value)) {
      return;
    }

    searchStore.updateSearchableFieldFilterValue(
      props.filter.id,
      loadedValues[0]
    );
    selectedValue.value = loadedValues[0];
  },
  { immediate: true }
);
</script>
<style scoped></style>
