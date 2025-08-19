<template>
  <div class="grid md:grid-cols-2 gap-2 rounded-md">
    <InputGroup
      :id="`${modelValue.id}-label`"
      :modelValue="modelValue.label"
      label="Label"
      @update:modelValue="handleUpdateLabel($event as string)" />
    <SelectGroup
      :id="`${modelValue.id}-select`"
      :modelValue="isShowingRange ? 'range' : 'moment'"
      label="Date Type"
      :options="[
        { id: 'moment', label: 'Moment' },
        { id: 'range', label: 'Range' },
      ]"
      @update:modelValue="handleUpdateDateType" />

    <div
      :class="{
        'col-span-2': !isShowingRange,
      }">
      <InputGroup
        :id="`${modelValue.id}-start-date`"
        :label="isShowingRange ? 'Start Date' : 'Date'"
        :modelValue="modelValue.start.text ?? ''"
        :inputClass="{
          'border border-solid border-red-700 focus:border-red-700 !bg-red-100/50':
            !isValidStartDate,
        }"
        @update:modelValue="handleUpdateStartDate($event as string)" />
      <div class="pl-4">
        <p v-if="!isValidStartDate" class="text-red-700 text-xs my-1">
          Invalid start date.
        </p>
        <p
          v-else-if="modelValue.start.text"
          class="text-neutral-500 text-xs my-1">
          {{ parsedStartDate }}
        </p>
      </div>
    </div>

    <div v-if="isShowingRange">
      <InputGroup
        :id="`${modelValue.id}-end-date`"
        label="End Date"
        :modelValue="modelValue.end.text ?? ''"
        @update:modelValue="handleUpdateEndDate($event as string)" />
      <div class="pl-4">
        <p v-if="modelValue.end.text" class="text-neutral-500 text-xs my-1">
          {{ parsedEndDate }}
        </p>
        <p v-if="!isValidEndDate" class="text-red-700 text-xs my-1">
          Invalid end date.
        </p>
        <p v-else-if="!isStartBeforeEnd" class="text-red-700 text-xs my-1">
          End date must be after start date
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
import { computed, inject, ref, watch } from "vue";
import { ASSET_EDITOR_PROVIDE_KEY } from "@/constants/constants";

const props = defineProps<{
  modelValue: Type.WithId<Type.DateWidgetContent>;
}>();

const emit = defineEmits<{
  (
    e: "update:modelValue",
    contentItem: Type.WithId<Type.DateWidgetContent>
  ): void;
}>();

const isShowingRange = ref(!!props.modelValue.end.text);

const handleUpdateDateType = (value: string) => {
  isShowingRange.value = value === "range";

  // if we're not showing range, clear end date
  if (!isShowingRange.value) {
    emit("update:modelValue", {
      ...props.modelValue,
      end: {
        text: "",
        numeric: null,
      },
    });
  }
};

const handleUpdateLabel = (value: string) => {
  emit("update:modelValue", {
    ...props.modelValue,
    label: value as string,
  });
};

const parsedStartDate = computed(() => {
  if (!props.modelValue.start.numeric) {
    return null;
  }
  return unixTimestampToFormattedDate(props.modelValue.start.numeric);
});

const isWidgetContentDirty = computed(() => {
  const content = props.modelValue;
  return [content.start.text, content.end.text, content.label].some(
    (str) => str !== "" && str !== null
  );
});

const isValidStartDate = computed(() => {
  if (!isWidgetContentDirty.value) return true;

  return (
    props.modelValue.start.text !== "" &&
    props.modelValue.start.numeric !== null
  );
});

const handleUpdateStartDate = (startDateText: string) => {
  const startDateNumeric = parseDateString(startDateText);

  emit("update:modelValue", {
    ...props.modelValue,
    start: {
      ...props.modelValue.start,
      text: startDateText,
      numeric: startDateNumeric,
    },
  });
};

const parsedEndDate = computed(() => {
  if (!props.modelValue.end.numeric) {
    return null;
  }

  return unixTimestampToFormattedDate(props.modelValue.end.numeric);
});

const isStartBeforeEnd = computed(() => {
  const startNumeric: string | null = props.modelValue.start.numeric;
  const endNumeric: string | null = props.modelValue.end.numeric;
  if (startNumeric === null || endNumeric === null) {
    return true;
  }

  return BigInt(startNumeric) <= BigInt(endNumeric);
});

const isValidEndDate = computed(() => {
  if (!isWidgetContentDirty.value) {
    return true;
  }
  return (
    props.modelValue.end.numeric !== null &&
    props.modelValue.end.text !== "" &&
    isStartBeforeEnd.value
  );
});

const handleUpdateEndDate = (endDateText: string) => {
  const endDateNumeric: string | null = parseDateString(endDateText);

  emit("update:modelValue", {
    ...props.modelValue,
    end: {
      ...props.modelValue.end,
      text: endDateText,
      numeric: endDateNumeric,
    },
  });
};

const isWidgetContentItemValid = computed(() => {
  const hasEndDate = props.modelValue.end.numeric;
  return (
    isValidStartDate.value &&
    // either no end date or valid end date
    (!hasEndDate || (isValidEndDate.value && isStartBeforeEnd.value))
  );
});

const parentAssetEditor = inject(ASSET_EDITOR_PROVIDE_KEY);

// report the current validation status to parent asset editor
// so it can display
watch(isWidgetContentItemValid, (isValid) => {
  if (!parentAssetEditor) {
    console.warn(
      "cannot update widget content item validation status: no parent asset editor"
    );
    return;
  }
  parentAssetEditor?.updateWidgetContentItemValidationStatus(
    props.modelValue.id,
    isValid
  );
});
</script>
<style scoped></style>
