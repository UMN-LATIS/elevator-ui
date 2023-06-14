<template>
  <div
    class="filter-row"
    :class="{
      'filter-row--is-only-row': searchStore.totalFieldFilterCount === 1,
      'filter-row--is-first-row': rowIndex === 0,
    }"
  >
    <Button
      class="text-xs filter-row__operator"
      variant="tertiary"
      type="button"
      @click="handleSearchOperatorClick"
    >
      {{ searchOperator }}
    </Button>
    <p class="filter-row__name text-sm p-2">{{ label }}</p>

    <div class="filter-row__value text-sm">
      <slot />
    </div>

    <button
      class="filter-row__remove py-2 self-start w-full flex items-center justify-center"
      type="button"
      @click="$emit('remove')"
    >
      <CircleXIcon class="!w-5 !h-5" />
    </button>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import Button from "@/components/Button/Button.vue";
import { CircleXIcon } from "@/icons";
import { useSearchStore } from "@/stores/searchStore";

defineProps<{
  label: string;
  rowIndex: number;
}>();

defineEmits<{
  (event: "remove"): void;
}>();

const searchStore = useSearchStore();

const searchOperator = computed(
  () => searchStore.filterBy.searchableFieldsOperator
);

function handleSearchOperatorClick() {
  const currentOperator = searchStore.filterBy.searchableFieldsOperator;
  const newOperator = currentOperator === "AND" ? "OR" : "AND";
  searchStore.updateSearchableFieldsOperator(newOperator);
}
</script>
<style scoped>
.filter-row {
  display: grid;
  grid-template-areas: "operator name value is-fuzzy remove";
  grid-template-columns: 2rem 1fr 2fr 3rem 2rem;
  align-items: baseline;
  gap: 0.25rem;
}

@media (max-width: 30rem) {
  .filter-row {
    grid-template-areas:
      "operator name is-fuzzy remove"
      ". value . .";
    grid-template-columns: 2rem 1fr 3rem 2rem;
  }
}

.filter-row--is-only-row {
  grid-template-areas: "name value is-fuzzy remove";
  grid-template-columns: 1fr 2fr 3rem 2rem;
}

.filter-row--is-first-row .filter-row__operator {
  display: none;
}

.filter-row__operator {
  grid-area: operator;
}
.filter-row__name {
  grid-area: name;
}

.filter-row__value {
  grid-area: value;
}

.filter-row__is-fuzzy {
  grid-area: is-fuzzy;
}

.filter-row__remove {
  grid-area: remove;
  justify-self: end;
}
</style>
