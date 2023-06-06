<template>
  <section class="my-4">
    <div class="flex justify-between">
      <header class="flex items-baseline gap-2 mb-2">
        <h3 class="font-bold">Fields</h3>
        <Button
          v-if="searchStore.filterBy.searchableFieldsMap.size"
          variant="tertiary"
          @click="searchStore.clearSearchableFieldsFilters"
        >
          clear
        </Button>
      </header>
    </div>

    <div
      v-if="searchStore.fieldFilters.length"
      class="p-2 bg-transparent-black-50 rounded-md mb-4 flex flex-col gap-2"
    >
      <FilterByFieldsRow
        v-for="(filter, index) in searchStore.fieldFilters"
        :key="filter.id"
        :filter="filter"
        :rowIndex="index"
      />
    </div>

    <div class="flex justify-between items-baseline">
      <AdvSearchDropDown
        v-if="supportedSearchableFields.length"
        label="Add Field"
      >
        <AdvSearchDropDownItem
          v-for="field in supportedSearchableFields"
          :key="field.id"
          class="flex items-center justify-between cursor-pointer"
          @click="searchStore.addSearchableFieldFilter(field.id)"
        >
          <span class="flex-1">{{ field.label }}</span>
          <span class="text-xs text-neutral-300 capitalize">{{
            field.type
          }}</span>
        </AdvSearchDropDownItem>
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

const instanceStore = useInstanceStore();
const searchStore = useSearchStore();

const supportedSearchableFields = computed(() => {
  return instanceStore.searchableFields.filter((field) =>
    searchStore.supportedSearchableFieldTypes.includes(field.type)
  );
});
</script>
