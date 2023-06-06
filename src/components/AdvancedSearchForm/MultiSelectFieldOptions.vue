<template>
  <div>
    <CascadeSelect
      v-if="optionTree"
      :options="optionTree"
      :initialSelectedValues="props.filter.value.split(',')"
      class="!gap-1"
      labelClass="sr-only"
      selectClass="text-sm border-neutral-200"
      @change="handleCascadeSelectChange"
    />
  </div>
</template>
<script setup lang="ts">
import api from "@/api";
import {
  SearchableFieldFilter,
  SearchableMultiSelectField,
  TreeNode,
} from "@/types";
import { ref, watch, computed } from "vue";
import { useSearchStore } from "@/stores/searchStore";
import { useInstanceStore } from "@/stores/instanceStore";
import CascadeSelect from "@/components/CascadeSelect/CascadeSelect.vue";

const props = defineProps<{
  filter: SearchableFieldFilter;
}>();

const searchStore = useSearchStore();
const instanceStore = useInstanceStore();

const field = computed(() => {
  return instanceStore.getSearchableField<SearchableMultiSelectField>(
    props.filter.fieldId
  );
});

const optionTree = ref<TreeNode | null>(null);

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
