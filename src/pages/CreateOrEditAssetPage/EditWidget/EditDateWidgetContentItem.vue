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
          'border border-solid border-error focus:border-error !bg-error-container':
            hasStartDateError,
        }"
        @update:modelValue="handleUpdateStartDate($event as string)" />
      <div class="pl-4">
        <p v-if="hasStartDateError" class="text-error text-xs my-1">
          {{ startDateErrors.join(". ") }}
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
        :inputClass="{
          'border border-solid border-error focus:border-error !bg-error-container':
            hasEndDateError,
        }"
        @update:modelValue="handleUpdateEndDate($event as string)" />
      <div class="pl-4">
        <p v-if="hasEndDateError" class="text-error text-xs my-1">
          {{ endDateErrors.join(". ") }}
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
import { useAssetValidation } from "../useAssetEditor/useAssetValidation";
import { useAssetEditor } from "../useAssetEditor/useAssetEditor";
import invariant from "tiny-invariant";

const props = defineProps<{
  modelValue: Type.WithId<Type.DateWidgetContent>;
  widgetDef?: Type.WidgetDef;
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

const { widgetValidations } = useAssetValidation();
const parentAssetEditor = useAssetEditor();

// Get the proper widget instance ID
const widgetInstanceId = computed(() => {
  if (!props.widgetDef) return null;
  invariant(
    parentAssetEditor,
    "Asset editor not found. Make sure this component is used within an AssetEditor context."
  );
  return parentAssetEditor.getWidgetInstanceId(props.widgetDef.widgetId);
});

// Find validation for current widget using proper widget instance ID
const widgetValidation = computed(() => {
  if (!widgetInstanceId.value) return null;
  return widgetValidations.value.find((validation) => {
    return validation.id === widgetInstanceId.value;
  });
});

const startDateErrors = computed(() => {
  return (
    widgetValidation.value?.errors.getItemFieldErrors(
      props.modelValue.id,
      "start"
    ) || []
  );
});

const endDateErrors = computed(() => {
  return (
    widgetValidation.value?.errors.getItemFieldErrors(
      props.modelValue.id,
      "end"
    ) || []
  );
});

const hasStartDateError = computed(() => startDateErrors.value.length > 0);
const hasEndDateError = computed(() => endDateErrors.value.length > 0);

const parsedStartDate = computed(() => {
  if (!props.modelValue.start.numeric) {
    return null;
  }
  return unixTimestampToFormattedDate(props.modelValue.start.numeric);
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
</script>
<style scoped></style>
