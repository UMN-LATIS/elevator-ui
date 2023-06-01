<template>
  <select v-model="selectedValue">
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

const selectedValue = ref(props.filter.value); // <== Add this line
const options = ref<string[]>([props.filter.value]);
const searchStore = useSearchStore();
const instanceStore = useInstanceStore();

const field = computed(() => {
  return instanceStore.getSearchableField(props.filter.fieldId);
});

watch(
  [field, selectedValue], // <== Add selectedValue here
  async ([newField, newSelectedValue], [oldField, oldSelectedValue]) => {
    // <== Add selectedValue here
    // if just the value changed, don't do anything
    if (newSelectedValue === oldSelectedValue) {
      return;
    }

    // if there's no field, throw an error
    if (!newField) {
      throw new Error(
        `Could not find searchable field with id ${props.filter.fieldId}`
      );
    }

    // for other cases, update the options list
    const optionsFromResponse = await api.getSearchableFieldValues(newField);

    // remove any empty strings returned from the API
    // (I'm not sure why the API returns empty strings as choices, but it does)
    options.value = optionsFromResponse.filter((opt) => opt !== "");
  },
  { immediate: true }
);
</script>

<style scoped></style>
