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
      v-if="fieldFilterCount"
      class="p-2 bg-transparent-black-50 rounded-md mb-4"
    >
      <FilterByFieldsRow
        v-for="(
          filter, index
        ) in searchStore.filterBy.searchableFieldsMap.values()"
        :key="filter.id"
        class="mb-2"
        :class="{
          'pl-6': index === 0 && fieldFilterCount > 1,
        }"
        :filter="filter"
        :hideOperator="index === 0"
      />
    </div>

    <div class="flex justify-between items-baseline">
      <DropDown
        v-if="supportedSearchableFields.length"
        label="Add Field"
        class="border border-neutral-900 rounded-md"
        alignment="left"
        labelClass="justify-between pl-3 whitespace-nowrap"
      >
        <div class="max-h-[50vh] overflow-y-auto">
          <DropDownItem
            v-for="field in supportedSearchableFields"
            :key="field.id"
            class="flex items-center justify-between cursor-pointer"
            @click="searchStore.addSearchableFieldFilter(field.id)"
          >
            <span class="flex-1">{{ field.label }}</span>
            <span class="text-xs text-neutral-300 capitalize">{{
              field.type
            }}</span>
          </DropDownItem>
        </div>
      </DropDown>
    </div>
  </section>
</template>
<script setup lang="ts">
import { computed } from "vue";
import Button from "@/components/Button/Button.vue";
import { useSearchStore } from "@/stores/searchStore";
import DropDown from "@/components/DropDown/DropDown.vue";
import DropDownItem from "@/components/DropDown/DropDownItem.vue";
import { useInstanceStore } from "@/stores/instanceStore";
import FilterByFieldsRow from "./FilterByFieldsRow.vue";

const instanceStore = useInstanceStore();
const searchStore = useSearchStore();

const supportedTypes = ["text", "select"];
const supportedSearchableFields = computed(() => {
  return instanceStore.searchableFields.filter((field) =>
    supportedTypes.includes(field.type)
  );
});

const fieldFilterCount = computed(
  () => searchStore.filterBy.searchableFieldsMap.size
);
</script>
