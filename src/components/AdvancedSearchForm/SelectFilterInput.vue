<template>
  <select>
    <option v-for="opt in options" :key="opt">{{ opt }}</option>
  </select>
</template>
<script setup lang="ts">
import api from "@/api";
import type { SearchableSelectFieldFilter } from "@/types";
import { onMounted, ref } from "vue";

const props = defineProps<{
  filter: SearchableSelectFieldFilter;
}>();

const options = ref(props.filter.options || []);

onMounted(async () => {
  console.log(props.filter);

  if (!props.filter.options) {
    console.log("fetch options");
    options.value = await api.getSearchableSelectFieldOptions(props.filter);
    console.log(options.value);
  }
});
</script>
<style scoped></style>
