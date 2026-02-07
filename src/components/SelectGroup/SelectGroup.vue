<template>
  <div class="flex flex-col gap-1">
    <label
      :for="id"
      :class="
        cn([
          'text-xs uppercase font-medium text-on-surface',
          {
            'sr-only': !showLabel,
          },
          labelClass,
        ])
      ">
      {{ label }}
      <span v-if="required" class="text-error">*</span>
    </label>
    <select
      :id="id"
      :value="modelValue ?? ''"
      :class="
        cn(['rounded-md border-none bg-surface-container text-sm', selectClass])
      "
      readonly
      required
      @change="
        handleUpdateSelection(($event.target as HTMLSelectElement).value)
      ">
      <option value="" disabled selected>{{ placeholder }}</option>
      <option
        v-for="opt in options"
        :key="opt.id"
        :value="opt.id"
        :disabled="!!opt.disabled">
        {{ opt.label }}
      </option>
    </select>
  </div>
</template>
<script setup lang="ts" generic="TModelValue = string | number | null">
import { cn } from "@/lib/utils";
import { CSSClass, SelectOption } from "@/types";

withDefaults(
  defineProps<{
    modelValue: TModelValue;
    label: string;
    options: Array<SelectOption<string | number>>;
    required?: boolean;
    id?: string;
    placeholder?: string;
    showLabel?: boolean;
    labelClass?: CSSClass;
    selectClass?: CSSClass;
  }>(),
  {
    id: () => `select-${crypto.randomUUID()}`,
    placeholder: "--",
    required: false,
    showLabel: true,
    labelClass: "",
    selectClass: "",
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: TModelValue): void;
}>();

function handleUpdateSelection(value: string) {
  // if the value is empty, set it to null
  if (value === "") {
    return emit("update:modelValue", null as TModelValue);
  }

  // if the value is a number, convert it to a number
  const maybeNumber = Number(value);
  if (Number.isInteger(maybeNumber)) {
    return emit("update:modelValue", maybeNumber as TModelValue);
  }

  // otherwise, return the value as a string
  return emit("update:modelValue", value as TModelValue);
}
</script>
<style scoped></style>
