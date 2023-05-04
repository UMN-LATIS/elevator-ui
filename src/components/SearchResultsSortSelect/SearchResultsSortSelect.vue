<template>
  <div class="flex items-baseline gap-4">
    <label
      for="location"
      class="block text-sm font-medium leading-6 text-gray-900"
      >Sort</label
    >
    <select
      id="location"
      name="location"
      class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
      @change="handleOptionChange"
    >
      <option
        v-for="(sortOptionLabel, sortOptionKey) in sortOptions"
        :key="sortOptionKey"
        :value="sortOptionKey"
        :selected="selectedSortOption === sortOptionKey"
      >
        {{ sortOptionLabel }}
      </option>
    </select>
  </div>
</template>
<script setup lang="ts">
import { SearchSortOptions } from "@/types";

defineProps<{
  sortOptions: SearchSortOptions | null;
  selectedSortOption: keyof SearchSortOptions | null;
}>();

const emit = defineEmits<{
  (event: "sortOptionChange", sortOption: keyof SearchSortOptions): void;
}>();

function handleOptionChange(event: Event) {
  const newOption = (event.target as HTMLSelectElement).value ?? null;
  console.log("select change", newOption);
  emit("sortOptionChange", newOption);
}
</script>
<style scoped></style>
