<template>
  <BaseFilterRow
    label="Any Date"
    :rowIndex="rowIndex"
    @remove="searchStore.removeDateRangeFilter">
    <div class="flex flex-col lg:flex-row gap-1">
      <InputGroup
        v-if="searchStore.filterBy.globalDateRange"
        id="filter-by-date-range-start-date"
        v-model="searchStore.filterBy.globalDateRange.startDate"
        class="text-sm"
        inputClass="!bg-white !border !border-outline"
        label="Start Date"
        :labelHidden="true"
        placeholder="Start Date" />
      <InputGroup
        v-if="searchStore.filterBy.globalDateRange"
        id="filter-by-date-range-end-date"
        v-model="searchStore.filterBy.globalDateRange.endDate"
        class="text-sm"
        inputClass="!bg-white !border !border-outline"
        label="End Date"
        :labelHidden="true"
        :placeholder="`End Date`" />
    </div>
  </BaseFilterRow>
</template>
<script setup lang="ts">
import { useSearchStore } from "@/stores/searchStore";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import BaseFilterRow from "./BaseFilterRow.vue";

defineProps<{
  rowIndex: number;
}>();

const searchStore = useSearchStore();
</script>
<style scoped></style>
