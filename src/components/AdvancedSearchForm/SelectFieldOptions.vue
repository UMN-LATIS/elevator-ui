<template>
  <select
    :value="selectedOption"
    class="rounded-md w-full border-neutral-200"
    @change="handleSelectChange">
    <option v-for="opt in options" :key="opt" :value="opt">
      {{ opt === "" ? "-" : opt }}
    </option>
  </select>
</template>
<script setup lang="ts">
import api from "@/api";
import { SearchableSpecificFieldFilter, SearchableSelectField } from "@/types";
import { ref, watch, computed } from "vue";
import { useSearchStore } from "@/stores/searchStore";
import { useInstanceStore } from "@/stores/instanceStore";

const props = defineProps<{
  filter: SearchableSpecificFieldFilter;
}>();

// adding a ref for selected value so that we can reactively
// change the selected option once the options list loads
const selectedOption = ref<string>(props.filter.value);
const options = ref<string[]>([props.filter.value]);
const searchStore = useSearchStore();
const instanceStore = useInstanceStore();

const field = computed(() => {
  return instanceStore.getSearchableField<SearchableSelectField>(
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

    // for other cases, update the options list
    options.value = await api.getSearchableSelectFieldValues(field.value);

    // if the new value is not in the options list, set it to the first option
    if (!options.value.includes(props.filter.value)) {
      searchStore.updateSearchableFieldFilterValue(
        props.filter.id,
        options.value[0]
      );

      // also update the selected option
      selectedOption.value = options.value[0];
    }
  },
  { immediate: true }
);
</script>
<style scoped></style>
