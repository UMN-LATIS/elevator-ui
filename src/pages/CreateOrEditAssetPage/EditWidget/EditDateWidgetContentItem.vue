<template>
  <div class="grid md:grid-cols-2 gap-2 rounded-md">
    <InputGroup
      :id="`${modelValue.id}-label`"
      :modelValue="modelValue.label"
      label="Label"
      @update:modelValue="handleUpdateLabel($event as string)" />
    <SelectGroup
      :id="`${modelValue.id}-select`"
      :modelValue="modelValue.range ? 'range' : 'moment'"
      label="Date Type"
      :options="[
        { id: 'moment', label: 'Moment' },
        { id: 'range', label: 'Range' },
      ]"
      @update:modelValue="handleUpdateDateType" />

    <div
      :class="{
        'col-span-2': !modelValue.range,
      }">
      <InputGroup
        :id="`${modelValue.id}-start-date`"
        :label="modelValue.range ? 'Start Date' : 'Date'"
        :modelValue="modelValue.start.text ?? ''"
        :inputClass="{
          'border border-solid border-red-700 focus:border-red-700 !bg-red-100/50':
            hasStartDateError,
        }"
        @update:modelValue="handleUpdateStartDate($event as string)" />
      <div class="pl-4">
        <p v-if="hasStartDateError" class="text-red-700 text-xs my-1">
          Invalid date.
        </p>
        <p
          v-else-if="modelValue.start.text"
          class="text-neutral-500 text-xs my-1">
          {{ parsedStartDate }}
        </p>
      </div>
    </div>

    <div v-if="modelValue.range">
      <InputGroup
        :id="`${modelValue.id}-end-date`"
        label="End Date"
        :modelValue="modelValue.end.text ?? ''"
        @update:modelValue="handleUpdateEndDate($event as string)" />
      <div class="pl-4">
        <p v-if="hasEndDateError" class="text-red-700 text-xs my-1">
          Invalid date.
        </p>
        <p
          v-else-if="modelValue.end.text"
          class="text-neutral-500 text-xs my-1">
          {{ parsedEndDate }}
        </p>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import * as Type from "@/types";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import {
  parseDateString,
  unixTimestampToFormattedDate,
} from "@/helpers/parseDateString";
import { computed, ref } from "vue";

const props = defineProps<{
  modelValue: Type.WithId<Type.DateWidgetContent>;
}>();

const emit = defineEmits<{
  (
    e: "update:modelValue",
    contentItem: Type.WithId<Type.DateWidgetContent>
  ): void;
}>();

const handleUpdateDateType = (value: string) => {
  emit("update:modelValue", {
    ...props.modelValue,
    range: value === "range",
  });
};

const handleUpdateLabel = (value: string) => {
  emit("update:modelValue", {
    ...props.modelValue,
    label: value as string,
  });
};

const hasStartDateError = ref(false);
const parsedStartDate = computed(() => {
  if (!props.modelValue.start.numeric) {
    return null;
  }
  return unixTimestampToFormattedDate(props.modelValue.start.numeric);
});

const handleUpdateStartDate = (value: string) => {
  hasStartDateError.value = false;
  const parsedDate = parseDateString(value);

  if (parsedDate === null) {
    hasStartDateError.value = true;
  }

  emit("update:modelValue", {
    ...props.modelValue,
    start: {
      ...props.modelValue.start,
      text: value,
      numeric: parsedDate,
    },
  });
};

const hasEndDateError = ref(false);
const parsedEndDate = computed(() => {
  if (!props.modelValue.end.numeric) {
    return null;
  }
  return unixTimestampToFormattedDate(props.modelValue.end.numeric);
});
const handleUpdateEndDate = (value: string) => {
  hasEndDateError.value = false;
  const parsedDate = parseDateString(value);

  if (parsedDate === null) {
    hasEndDateError.value = true;
  }

  emit("update:modelValue", {
    ...props.modelValue,
    end: {
      ...props.modelValue.end,
      text: value,
      numeric: parsedDate,
    },
  });
};
</script>
<style scoped></style>
