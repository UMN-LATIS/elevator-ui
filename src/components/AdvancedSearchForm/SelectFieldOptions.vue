<template>
  <select :value="props.filter.value" @change="handleSelectChange">
    <option disabled value="">Choose an option</option>
    <option v-for="opt in options" :key="opt" :value="opt">{{ opt }}</option>
  </select>
</template>
<script setup lang="ts">
import api from "@/api";
import type { SearchableFieldFilter } from "@/types";
import { ref, watch, computed } from "vue";
import { useSearchStore } from "@/stores/searchStore";
import { useInstanceStore } from "@/stores/instanceStore";

const props = defineProps<{
  filter: SearchableFieldFilter;
}>();

const options = ref<string[]>([props.filter.value]);
const searchStore = useSearchStore();
const instanceStore = useInstanceStore();

const field = computed(() => {
  return instanceStore.getSearchableField(props.filter.fieldId);
});

function handleSelectChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  searchStore.updateSearchableFieldFilterValue(props.filter.id, target.value);
}

watch(
  [field],
  async () => {
    // if just the value changed, don't do anything
    if (props.filter.value === searchStore.filterBy.searchableFieldsOperator) {
      return;
    }

    // if there's no field, throw an error
    if (!field.value) {
      throw new Error(
        `Could not find searchable field with id ${props.filter.fieldId}`
      );
    }

    // for other cases, update the options list
    const optionsFromResponse = await api.getSearchableFieldValues(field.value);

    // remove any empty strings returned from the API
    // (I'm not sure why the API returns empty strings as choices, but it does)
    options.value = optionsFromResponse.filter((opt) => opt !== "");
  },
  { immediate: true }
);
</script>
<style scoped></style>
