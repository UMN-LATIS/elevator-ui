<template>
  <select
    :value="selectedOption"
    class="rounded-md"
    @change="handleSelectChange"
  >
    <option value="boolean_true">{{ trueLabel }}</option>
    <option value="boolean_false">{{ falseLabel }}</option>
  </select>
</template>
<script setup lang="ts">
import api from "@/api";
import {
  SearchableCheckboxField,
  SearchableCheckboxFieldFilter,
} from "@/types";
import { ref, watch, computed } from "vue";
import { useSearchStore } from "@/stores/searchStore";
import { useInstanceStore } from "@/stores/instanceStore";

const props = defineProps<{
  filter: SearchableCheckboxFieldFilter;
}>();

// adding a ref for selected value so that we can reactively
// change the selected option once the options list loads
const selectedOption = ref(props.filter.value);
const trueLabel = ref("Checked");
const falseLabel = ref("Unchecked");
const searchStore = useSearchStore();
const instanceStore = useInstanceStore();

const field = computed(() => {
  return instanceStore.getSearchableField<SearchableCheckboxField>(
    props.filter.fieldId
  );
});

function handleSelectChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  searchStore.updateSearchableFieldFilterValue(props.filter.id, target.value);
}

watch(
  [field],
  async () => {
    // if there's no field, throw an error
    if (!field.value) {
      throw new Error(
        `Could not find searchable field with id ${props.filter.fieldId}`
      );
    }

    // update the options list
    const labels = await api.getSearchableCheckboxFieldValues(field.value);
    trueLabel.value = labels.boolean_true;
    falseLabel.value = labels.boolean_false;

    // if the filter has a value, update the selected option
    // or set the default to true
    selectedOption.value = props.filter.value ?? "boolean_true";
    searchStore.updateSearchableFieldFilterValue(
      props.filter.id,
      selectedOption.value
    );
  },
  { immediate: true }
);
</script>
<style scoped></style>
