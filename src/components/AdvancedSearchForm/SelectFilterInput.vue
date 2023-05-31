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
    options.value = ["option 1", "option 2", "option 3"];
    // options.value = await api.getSelectFilterOptions(filter.id);
  }
});
</script>
<style scoped></style>
