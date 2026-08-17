<template>
  <div>
    <CascadeSelect
      v-if="optionTree"
      :options="optionTree"
      :initialSelectedValues="props.filter.value.split(',')"
      class="!gap-1"
      labelClass="sr-only"
      @change="handleCascadeSelectChange" />
  </div>
</template>
<script setup lang="ts">
import api from "@/api";
import {
  SearchableSpecificFieldFilter,
  SearchableMultiSelectField,
} from "@/types";
import { computed, ref, watch } from "vue";
import { useSearchStore } from "@/stores/searchStore";
import CascadeSelect, {
  CascaderSelectOptions,
} from "@/components/CascadeSelect/CascadeSelect.vue";
import { useSearchableFields } from "@/composables/useSearchableFields";

const props = defineProps<{
  filter: SearchableSpecificFieldFilter;
}>();

const searchStore = useSearchStore();

const { getSearchableField } = useSearchableFields();

const field = computed(() =>
  getSearchableField<SearchableMultiSelectField>(props.filter.fieldId)
);

const optionTree = ref<CascaderSelectOptions | null>(null);

function handleCascadeSelectChange(selectedValues: string[]) {
  searchStore.updateSearchableFieldFilterValue(
    props.filter.id,
    selectedValues.join(",")
  );
}

watch(
  [field],
  async () => {
    // if there's no field, throw an error
    if (!field.value) {
      throw new Error(
        `Could not find searchable field with id ${props.filter.fieldId}`
      );
    }

    // for other cases, update the options list
    optionTree.value = await api.getSearchableMultiSelectFieldValues(
      field.value
    );
  },
  { immediate: true }
);
</script>
<style scoped></style>
