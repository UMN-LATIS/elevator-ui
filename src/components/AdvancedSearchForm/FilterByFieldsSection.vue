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
      class="w-full flex items-center gap-2 py-2"
    >
      <select
        class="rounded-md"
        :value="searchStore.getSearchableFieldFilter(filterId)?.fieldId"
        @change="
          searchStore.updateSearchableFieldFilterWithNewFilterId(
            filterId,
            ($event.target as HTMLSelectElement).value
          )
        "
      >
        <option
          v-for="field in instanceStore.searchableFields"
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
      v-if="instanceStore.searchableFields.length"
      label="Add Field"
      class="inline-flex border border-neutral-900 rounded-md"
      alignment="left"
      labelClass="p-2 !pr-0"
    >
      <div class="max-h-[50vh] overflow-y-auto">
        <DropDownItem
          v-for="field in instanceStore.searchableFields"
          :key="field.id"
          @click="searchStore.addSearchableFieldFilter(field.id)"
        >
          {{ field.label }}
        </DropDownItem>
      </div>
    </DropDown>
  </section>
</template>
<script setup lang="ts">
import Button from "@/components/Button/Button.vue";
import { CircleXIcon } from "@/icons";
import { useSearchStore } from "@/stores/searchStore";
import DropDown from "@/components/DropDown/DropDown.vue";
import DropDownItem from "@/components/DropDown/DropDownItem.vue";
import { useInstanceStore } from "@/stores/instanceStore";
import InputGroup from "../InputGroup/InputGroup.vue";

const instanceStore = useInstanceStore();
const searchStore = useSearchStore();
</script>
<style scoped></style>
