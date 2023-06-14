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
      class="p-4 bg-transparent-black-50 rounded-md flex flex-col gap-4 sm:gap-2 mb-4"
    >
      <div v-for="(filter, index) in sortedFilterRows" :key="filter.id">
        <FilterByGlobalDateRow
          v-if="filter.fieldId === GLOBAL_FIELD_IDS.DATE_RANGE"
          :rowIndex="index"
        />
        <FilterByGlobalLocationRow
          v-else-if="filter.fieldId === GLOBAL_FIELD_IDS.LOCATION"
          :rowIndex="index"
        />
        <FilterByGlobalFileTypeRow
          v-else-if="filter.fieldId === GLOBAL_FIELD_IDS.FILE_TYPE"
          :rowIndex="index"
        />
        <FilterBySpecificFieldsRow v-else :filter="filter" :rowIndex="index" />
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
              class="flex items-center cursor-pointer aria-disabled:opacity-25"
              :disabled="searchStore.hasDateRangeFilter"
              @click="searchStore.addDateRangeFilter()"
            >
              Any Date
            </AdvSearchDropDownItem>

            <AdvSearchDropDownItem
              class="flex items-center cursor-pointer aria-disabled:opacity-25"
              :disabled="searchStore.hasLocationFilter"
              @click="searchStore.addLocationFilter()"
            >
              Any Location
            </AdvSearchDropDownItem>
            <AdvSearchDropDownItem
              class="flex items-center cursor-pointer aria-disabled:opacity-25"
              :disabled="searchStore.hasFileTypeFilter"
              @click="searchStore.addFileTypeFilter()"
            >
              Any File Type
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
import FilterBySpecificFieldsRow from "./FilterBySpecificFieldsRow.vue";
import FilterByGlobalDateRow from "./FilterByGlobalDateRow.vue";
import FilterByGlobalLocationRow from "./FilterByGlobalLocationRow.vue";
import FilterByGlobalFileTypeRow from "./FilterByGlobalFileTypeRow.vue";
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
  const {
    globalDateRangeAsFilter,
    globalLocationAsFilter,
    globalFileTypeAsFilter,
  } = searchStore;

  // if either filter is null, remove them from our list
  return [
    globalDateRangeAsFilter,
    globalLocationAsFilter,
    globalFileTypeAsFilter,
  ].filter((filter): filter is SearchableSpecificFieldFilter =>
    Boolean(filter)
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
