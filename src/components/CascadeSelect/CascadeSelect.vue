<template>
  <div class="">
    <label v-for="(selected, index) in listOfSelected" :key="index">
      {{ getLabel(options) }}
      <select v-model="listOfSelected[index]">
        <option value="" disabled>Select a {{ getLabel(options) }}</option>
        <option v-for="opt in getOpts(options)" :key="opt" :value="opt">
          {{ opt }}
        </option>
      </select>
    </label>
    <div>
      <p>
        <code>options: {{ options }}</code>
      </p>
      <p>
        <code>listOfSelected: {{ listOfSelected }}</code>
      </p>
    </div>
  </div>
</template>
<script setup lang="ts">
import { reactive } from "vue";

interface CascaderSelectOptions {
  [label: string]: string[] | CascaderSelectOptions;
}

defineProps<{
  options: CascaderSelectOptions;
}>();

const listOfSelected = reactive<string[]>([""]);

const getLabel = (options: CascaderSelectOptions): string => {
  return Object.keys(options)[0];
};

const getOpts = (options: CascaderSelectOptions): string[] => {
  const values = Object.values(options);

  // option values could look like:
  // [['minneapolis', 'st. paul']]
  // or could be another level of nesting
  // [{ 'minneapolis': ...}, {'st. paul': ... }]
  // let's use the first value to determine which is which

  // if there's no first value, return an empty array
  if (values.length === 0) {
    return [];
  }

  // if the first value is an object, then
  // values looks like
  // [{ 'minneapolis': ...}, { 'st. paul': ... }]
  // and so we want the keys of each object within the array
  if (!Array.isArray(values[0])) {
    return values.map((obj) => Object.keys(obj)[0]);
  }

  // otherwise, values looks like [['minneapolis', 'st. paul']]
  return values[0];
};
</script>
<style scoped></style>
