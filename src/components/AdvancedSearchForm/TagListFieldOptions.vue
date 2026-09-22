<template>
  <select
    v-if="renderMode === 'select'"
    :value="filter.value"
    class="rounded-md w-full border-neutral-200"
    @change="onSelectChange">
    <option v-for="value in tagValues" :key="value" :value="value">
      {{ value === "" ? "-" : value }}
    </option>
  </select>

  <InputGroup
    v-else-if="renderMode === 'text'"
    :id="filter.id"
    class="text-sm"
    inputClass="!bg-white !border !border-neutral-200 placeholder:capitalize"
    :label="field.label"
    :modelValue="filter.value"
    :labelHidden="true"
    :placeholder="field.label"
    @update:modelValue="onTextChange" />
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
  const tagListField = instanceStore.getSearchableField<SearchableTagListField>(
    props.filter.fieldId
  );

  if (!tagListField) {
    throw new Error(
      `Could not find searchable field with id ${props.filter.fieldId}`
    );
  }
  return tagListField;
});

const tagValues = ref<string[] | null>(null);

const renderMode = computed((): "loading" | "text" | "select" => {
  if (tagValues.value === null) return "loading";
  if (tagValues.value.length === 0) return "text";
  return "select";
});

function onSelectChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  searchStore.updateSearchableFieldFilterValue(props.filter.id, target.value);
}

function onTextChange(value: string) {
  searchStore.updateSearchableFieldFilterValue(props.filter.id, value);
}

watch(
  field,
  async () => {
    tagValues.value = null;
    const loadedTagValues = await api.getSearchableTagListFieldValues(
      field.value
    );
    tagValues.value = loadedTagValues;

    const isCurrentValueOffered = loadedTagValues.includes(props.filter.value);
    if (renderMode.value === "text" || isCurrentValueOffered) {
      return;
    }

    searchStore.updateSearchableFieldFilterValue(
      props.filter.id,
      loadedTagValues[0]
    );
  },
  { immediate: true }
);
</script>
<style scoped></style>
