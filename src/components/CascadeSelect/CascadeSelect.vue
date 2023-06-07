<template>
  <div class="flex flex-col gap-4">
    <div
      v-for="(selected, segmentLevel) in listOfSelected"
      :key="segmentLevel"
      class="flex flex-col gap-1"
    >
      <label
        :class="['uppercase text-xs font-medium tracking-wider', labelClass]"
      >
        {{ selected.label }}
      </label>
      <select
        :class="['rounded-md', selectClass]"
        :value="selected.value"
        @change="
          handleSelectChange(
            segmentLevel,
            ($event.target as HTMLSelectElement).value
          )
        "
      >
        <option v-if="!selected.options.includes('')" value="" disabled>
          Select a {{ selected.label }}
        </option>
        <option v-for="opt in selected.options.sort()" :key="opt" :value="opt">
          {{ opt === "" ? "-" : opt }}
        </option>
      </select>
    </div>
  </div>
</template>
<script setup lang="ts">
import { path } from "ramda";
import { reactive, watch } from "vue";

interface CascaderSelectOptions {
  [label: string]: string[] | CascaderSelectOptions;
}

const props = defineProps<{
  options: CascaderSelectOptions;
  selectClass?: Record<string, boolean> | string[] | string;
  labelClass?: Record<string, boolean> | string[] | string;
  initialSelectedValues?: string[];
}>();

const emit = defineEmits<{
  (eventName: "change", selectedValues: string[]): void;
}>();

interface SelectedSegment {
  label: string;
  options: string[];
  value: string;
}

const listOfSelected = reactive<SelectedSegment[]>([
  ...createInitialListOfSelected(),
]);

function createInitialListOfSelected(): SelectedSegment[] {
  if (!props.initialSelectedValues?.length) {
    return [
      {
        label: getFirstKey(props.options),
        options: getFirstOptions(props.options),
        value: "",
      },
    ];
  }

  const selected: SelectedSegment[] = [];
  props.initialSelectedValues.forEach((value) => {
    const nextSelected = createNextSelectedSegment(selected, value);
    if (nextSelected) {
      selected.push(nextSelected);
    }
  });
  return selected;
}

function getFirstKey(options: CascaderSelectOptions): string {
  return Object.keys(options)[0];
}

function getFirstOptions(options: CascaderSelectOptions): string[] {
  const values: Record<string, unknown> | string[] =
    options[getFirstKey(options)];

  // if the first value is an array, then
  // values looks like: ['minneapolis', 'st. paul']
  if (Array.isArray(values)) {
    return values;
  }

  // otherwise, values is a record object like:
  // { 'minneapolis': ..., 'st. paul': ... }
  // and so the keys are our next level of options
  return Object.keys(values);
}

function createNextSelectedSegment(
  currentSegments: SelectedSegment[],
  initialValue = "",
  cascadeSelectOptions = props.options
): SelectedSegment | null {
  // get the current path by joining the labels and values
  const currentPath: string[] = [];
  currentSegments.forEach((segment) => {
    currentPath.push(segment.label);
    currentPath.push(segment.value);
  });

  // the `path` function below takes an array of keys
  // and returns the value at that path in the object:
  // path(['a', 'b'], { a: { b: 2 } })  =>  2
  const nextSegmentOptions = path<CascaderSelectOptions>(
    currentPath,
    cascadeSelectOptions
  );

  // if we couldn't find the next segment options then
  // we're at the end of the road, so we're done
  if (!nextSegmentOptions) {
    return null;
  }

  const label = getFirstKey(nextSegmentOptions);
  const options = getFirstOptions(nextSegmentOptions);

  // check if the initial value is in the options
  // if not, log it, but continue
  if (initialValue !== "" && !options.includes(initialValue)) {
    console.error(
      `Cannot create next selected: initial value ${initialValue} is not in the options ${options}`
    );
  }

  return {
    label,
    options,
    value: initialValue,
  };
}

function handleSelectChange(segmentLevel: number, value: string): void {
  // update the value of the current segment
  listOfSelected[segmentLevel].value = value;

  // remove any segments after this one
  listOfSelected.splice(segmentLevel + 1);

  // if the value is empty, then we're done
  if (!value) {
    return;
  }

  // otherwise add the next segment to the list of selected
  const nextSegment = createNextSelectedSegment(listOfSelected, "");

  // if no next segment, then we're at the end of the road
  // let the parent know that the selected values have changed
  // and we're done
  if (!nextSegment) {
    emit(
      "change",
      listOfSelected.map((segment) => segment.value)
    );
    return;
  }

  // otherwise add the next segment to the list of selected
  listOfSelected.push(nextSegment);

  emit(
    "change",
    listOfSelected.map((segment) => segment.value)
  );
}

watch(
  () => props.options,
  () => {
    // reset the list of selected options
    listOfSelected.splice(
      0,
      listOfSelected.length,
      ...createInitialListOfSelected()
    );
  }
);
</script>
<style scoped></style>
