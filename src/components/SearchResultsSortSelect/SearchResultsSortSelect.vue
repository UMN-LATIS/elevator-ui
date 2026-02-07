<template>
  <div class="search-results-sort-select flex items-baseline gap-2">
    <label for="location" class="sr-only">Sort</label>
    <select
      id="sort"
      name="sort"
      class="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-on-surface ring-1 ring-outline-variant focus:ring-2 focus:ring-m3-primary text-sm sm:leading-6 max-w-full bg-surface"
      :value="selectedSortOption"
      @change="handleOptionChange">
      <option
        v-for="(sortOptionLabel, sortOptionKey) in sortOptions"
        :key="sortOptionKey"
        :value="sortOptionKey"
        :disabled="sortOptionKey == SORT_KEYS.BEST_MATCH && !searchQuery">
        {{ sortOptionLabel }}
      </option>
    </select>
  </div>
</template>
<script setup lang="ts">
import { SORT_KEYS } from "@/constants/constants";
import { SearchSortOptions } from "@/types";

defineProps<{
  sortOptions: SearchSortOptions;
  selectedSortOption: keyof SearchSortOptions;
  searchQuery: string;
}>();

const emit = defineEmits<{
  (event: "sortOptionChange", sortOption: keyof SearchSortOptions): void;
}>();

function handleOptionChange(event: Event) {
  const newOption = (event.target as HTMLSelectElement).value ?? null;
  emit("sortOptionChange", newOption);
}
</script>
<style scoped></style>
