<template>
  <div class="flex items-baseline gap-2 group">
    <Button
      class="text-xs w-6 !ml-0"
      :class="{
        invisible: rowIndex === 0,
        hidden: searchStore.totalFieldFilterCount === 1,
      }"
      variant="tertiary"
      type="button"
      @click="handleSearchOperatorClick"
    >
      {{ searchOperator }}
    </Button>
    <p class="text-sm w-1/4">Date Range</p>

    <div class="flex-1 grid grid-cols-2 gap-2">
      <InputGroup
        v-if="searchStore.filterBy.globalDateRange"
        id="filter-by-date-range-start-date"
        v-model="searchStore.filterBy.globalDateRange.startDate"
        class="text-sm"
        inputClass="!bg-white !border !border-neutral-200"
        label="Start Date"
        :labelHidden="true"
        placeholder="Start Date"
      />
      <InputGroup
        v-if="searchStore.filterBy.globalDateRange"
        id="filter-by-date-range-end-date"
        v-model="searchStore.filterBy.globalDateRange.endDate"
        class="text-sm"
        inputClass="!bg-white !border !border-neutral-200"
        label="End Date"
        :labelHidden="true"
        :placeholder="`End Date`"
      />
    </div>

    <button
      type="button"
      class="self-start p-2 mt-[0.1rem]"
      @click="handleRemoveFilter"
    >
      <CircleXIcon class="w-5 h-5" />
    </button>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import Button from "@/components/Button/Button.vue";
import { CircleXIcon } from "@/icons";
import { useSearchStore } from "@/stores/searchStore";
import InputGroup from "@/components/InputGroup/InputGroup.vue";

defineProps<{
  rowIndex: number;
}>();

const searchStore = useSearchStore();

const searchOperator = computed(
  () => searchStore.filterBy.searchableFieldsOperator
);

function handleSearchOperatorClick() {
  const currentOperator = searchStore.filterBy.searchableFieldsOperator;
  const newOperator = currentOperator === "AND" ? "OR" : "AND";
  searchStore.updateSearchableFieldsOperator(newOperator);
}

function handleRemoveFilter() {
  searchStore.removeDateRangeFilter();
}
</script>
<style scoped>
select {
  background-image: url("data:image/svg+xml, %3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='%23111' %3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E");
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1rem;
  padding-right: 2.5rem;
  border-color: #e5e5e5;
}
</style>
