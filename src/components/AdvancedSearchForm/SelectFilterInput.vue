<template>
  <select :value="selectedOption" @change="handleSelectChange">
    <option v-for="opt in options" :key="opt">{{ opt }}</option>
  </select>
</template>
<script setup lang="ts">
import api from "@/api";
import type { SearchableSelectFieldFilter } from "@/types";
import { onMounted, ref } from "vue";

const props = defineProps<{
  filter: SearchableSelectFieldFilter;
  selectedOption?: string;
}>();

const emit = defineEmits<{
  (eventName: "change", value: string);
}>();

const options = ref(props.filter.options || []);

onMounted(async () => {
  if (!props.filter.options) {
    options.value = await api.getSearchableSelectFieldOptions(props.filter);
  }

  // if there's no selected option, select the first one
  if (!props.selectedOption && options.value.length) {
    emit("change", options.value[0]);
  }
});

function handleSelectChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  emit("change", target.value);
}
</script>
<style scoped></style>
