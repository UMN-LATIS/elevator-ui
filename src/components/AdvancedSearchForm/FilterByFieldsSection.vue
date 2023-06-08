<template>
  <section class="my-4">
    <div class="flex justify-between">
      <header class="flex items-baseline gap-2 mb-2">
        <h3 class="font-bold">Fields</h3>
        <Button
          v-if="searchStore.hasFieldFiltersApplied"
          variant="tertiary"
          @click="searchStore.clearSearchableFieldsFilters"
        >
          clear
        </Button>
      </header>
    </div>

    <div
      v-if="searchStore.hasFieldFiltersApplied"
      class="p-2 bg-transparent-black-50 rounded-md mb-4 flex flex-col gap-2"
    >
      <div v-for="(filter, index) in sortedFilterRows" :key="filter.id">
        <FilterByGlobalDateRow
          v-if="filter.fieldId === GLOBAL_FIELD_IDS.DATE_RANGE"
          :rowIndex="index"
        />
        <FilterByFieldsRow v-else :filter="filter" :rowIndex="index" />
      </div>
    </div>

    <div class="flex justify-between items-baseline">
      <AdvSearchDropDown
        v-if="supportedSearchableFields.length"
        label="Add Field"
      >
        <div class="divide-y divide-neutral-200">
          <div>
            <AdvSearchDropDownItem
              v-for="field in supportedSearchableFields"
              :key="field.id"
              class="flex items-center justify-between cursor-pointer"
              @click="searchStore.addSearchableFieldFilter(field.id)"
            >
              <span class="flex-1">{{ field.label }}</span>
            </AdvSearchDropDownItem>
          </div>
          <div>
            <AdvSearchDropDownItem
              class="flex items-center justify-between cursor-pointer aria-disabled:opacity-25"
              :disabled="searchStore.hasDateRangeFilter"
              @click="searchStore.addDateRangeFilter()"
            >
              <span class="flex-1">Date</span>
              <span class="text-xs text-neutral-300 capitalize">
                All Dates
              </span>
            </AdvSearchDropDownItem>
            <AdvSearchDropDownItem
              class="flex items-center justify-between cursor-pointer"
            >
              <span class="flex-1">Location</span>
              <span class="text-xs text-neutral-300 capitalize">
                All Locations
              </span>
            </AdvSearchDropDownItem>
          </div>
        </div>
      </AdvSearchDropDown>
    </div>
  </section>
</template>
<script setup lang="ts">
import { computed } from "vue";
import Button from "@/components/Button/Button.vue";
import { useSearchStore } from "@/stores/searchStore";
import AdvSearchDropDown from "./AdvSearchDropDown.vue";
import AdvSearchDropDownItem from "./AdvSearchDropDownItem.vue";
import { useInstanceStore } from "@/stores/instanceStore";
import FilterByFieldsRow from "./FilterByFieldsRow.vue";
import FilterByGlobalDateRow from "./FilterByGlobalDateRow.vue";
import type { SearchableSpecificFieldFilter } from "@/types";
import { GLOBAL_FIELD_IDS } from "@/constants/constants";

const instanceStore = useInstanceStore();
const searchStore = useSearchStore();

const supportedSearchableFields = computed(() => {
  return instanceStore.searchableFields.filter((field) =>
    searchStore.supportedSpecificFieldTypes.includes(field.type)
  );
});

const activeGlobalFilters = computed((): SearchableSpecificFieldFilter[] => {
  const { globalDateRangeAsFilter, globalLocationAsFilter } = searchStore;

  // if either filter is null, remove them from our list
  return [globalDateRangeAsFilter, globalLocationAsFilter].filter(
    (filter): filter is SearchableSpecificFieldFilter => Boolean(filter)
  );
});

const sortedFilterRows = computed((): SearchableSpecificFieldFilter[] => {
  return [
    ...searchStore.specificFieldFilters,
    ...activeGlobalFilters.value,
  ].sort((a, b) => {
    if (a.createdAt > b.createdAt) return 1;
    if (a.createdAt < b.createdAt) return -1;
    return 0;
  });
});
</script>
