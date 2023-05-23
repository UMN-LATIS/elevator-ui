<template>
  <section class="my-4">
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

    <div
      v-for="[filterId, filter] in searchStore.filterBy.searchableFieldsMap"
      :key="filterId"
      class="w-full flex items-center gap-2 my-2"
    >
      <select
        class="rounded-md w-1/4"
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
        :label="filter.label"
        :value="filter.value"
        :labelHidden="true"
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

    <DropDown
      v-if="supportedSearchableFields.length"
      label="Add Field"
      class="flex border border-neutral-900 rounded-md w-1/4"
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
