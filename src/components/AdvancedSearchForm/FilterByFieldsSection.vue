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
      <div
        v-for="(
          [filterId, filter], index
        ) in searchStore.filterBy.searchableFieldsMap.entries()"
        :key="filterId"
        class="w-full flex items-center gap-2 my-2"
      >
        <Button
          v-if="fieldFilterCount > 1"
          class="text-xs w-[1.5rem] ml-0"
          variant="tertiary"
          type="button"
          @click="
            searchStore.updateSearchableFieldsOperator(
              searchStore.filterBy.searchableFieldsOperator === 'AND'
                ? 'OR'
                : 'AND'
            )
          "
        >
          {{ index >= 1 ? searchStore.filterBy.searchableFieldsOperator : "" }}
        </Button>
        <select
          class="rounded-md w-1/3"
          :value="searchStore.getSearchableFieldFilter(filterId)?.fieldId"
          @change="
            searchStore.updateSearchableFieldFilterWithNewFilterId(
              filterId,
              ($event.target as HTMLSelectElement).value
            )
          "
        >
          <option
            v-for="field in supportedSearchableFields"
            :key="field.id"
            :value="field.id"
          >
            {{ field.label }}
          </option>
        </select>

        <InputGroup
          :id="filterId"
          class="flex-1"
          inputClass="!bg-white !border !border-neutral-900"
          :label="filter.label"
          :value="filter.value"
          :labelHidden="true"
          :placeholder="`Type your ${filter.label.toLowerCase()}...`"
          @input="
            searchStore.updateSearchableFieldFilterValue(
              filterId,
              ($event.target as HTMLInputElement).value
            )
          "
        />

        <button @click="searchStore.removeSearchableFieldIdFilter(filterId)">
          <CircleXIcon class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div class="flex justify-between items-baseline">
      <DropDown
        v-if="supportedSearchableFields.length"
        label="Add Field"
        class="border border-neutral-900 rounded-md w-1/4"
        alignment="left"
        labelClass="justify-between pl-3"
      >
        <div class="max-h-[50vh] overflow-y-auto">
          <DropDownItem
            v-for="field in supportedSearchableFields"
            :key="field.id"
            @click="searchStore.addSearchableFieldFilter(field.id)"
          >
            <span class="flex-1">{{ field.label }}</span>
          </DropDownItem>
        </div>
      </DropDown>
    </div>
  </section>
</template>
<script setup lang="ts">
import { computed } from "vue";
import Button from "@/components/Button/Button.vue";
import { CircleXIcon } from "@/icons";
import { useSearchStore } from "@/stores/searchStore";
import DropDown from "@/components/DropDown/DropDown.vue";
import DropDownItem from "@/components/DropDown/DropDownItem.vue";
import { useInstanceStore } from "@/stores/instanceStore";
import InputGroup from "../InputGroup/InputGroup.vue";

const instanceStore = useInstanceStore();
const searchStore = useSearchStore();

const supportedTypes = ["text"];
const supportedSearchableFields = computed(() => {
  return instanceStore.searchableFields.filter((field) =>
    supportedTypes.includes(field.type)
  );
});

const fieldFilterCount = computed(
  () => searchStore.filterBy.searchableFieldsMap.size
);
</script>
<style scoped>
select {
  background-image: url("data:image/svg+xml, %3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='%23111' %3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E");
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1rem;
  padding-right: 2.5rem;
  border-color: #111;
}
</style>
