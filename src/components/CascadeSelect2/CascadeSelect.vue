<template>
  <div class="cascading-select">
    <div v-for="(_, index) in visibleLevels" :key="index" class="select-level">
      <label>
        {{ getLabelForLevel(options, selectedValues, index, typeLabels) }}
      </label>
      <select
        :value="selectedValues[index]"
        :disabled="shouldDisableLevel(selectedValues, index)"
        @change="handleChange($event, index)">
        <option value="" disabled selected>
          {{
            getPlaceholderForLevel(
              options,
              selectedValues,
              index,
              typePlaceholders
            )
          }}
        </option>
        <option
          v-for="option in getOptionsForLevel(options, selectedValues, index)"
          :key="option.value"
          :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import {
  getOptionsForLevel,
  getLabelForLevel,
  getPlaceholderForLevel,
  shouldDisableLevel,
  calculateVisibleLevels,
} from "./cascadeSelectHelpers";

export interface Option {
  label: string;
  value: string;
  type: string;
  children?: Option[];
}

interface Props {
  options: Option[];
  modelValue: string[];
  typeLabels?: Record<string, string>;
  typePlaceholders?: Record<string, string>;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  typeLabels: () => ({
    country: "Country",
    state: "State",
    province: "Province",
    city: "City",
  }),
  typePlaceholders: () => ({
    country: "Select a country",
    state: "Select a state",
    province: "Select a province",
    city: "Select a city",
  }),
});

const emit = defineEmits<{
  (e: "update:modelValue", value: (string | number)[]): void;
}>();

const selectedValues = ref<(string | number)[]>([...props.modelValue]);

// Watch for external changes
watch(
  () => props.modelValue,
  (newValue) => {
    selectedValues.value = [...newValue];
  },
  { deep: true }
);

// Computed property using the pure function
const visibleLevels = computed(() =>
  calculateVisibleLevels(props.options, selectedValues.value)
);

// Handle selection change
function handleChange(event: Event, level: number): void {
  const value = (event.target as HTMLSelectElement).value;

  // Create a new array instead of mutating the existing one
  const newValues = [...selectedValues.value.slice(0, level), value];

  selectedValues.value = newValues;
  emit("update:modelValue", newValues);
}
</script>

<style scoped>
/* Styles remain the same */
</style>
