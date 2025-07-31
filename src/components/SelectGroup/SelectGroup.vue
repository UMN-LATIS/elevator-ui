<template>
  <div class="flex flex-col gap-1">
    <label
      :for="id"
      :class="
        cn([
          'text-xs uppercase font-medium text-neutral-700',
          {
            'sr-only': !showLabel,
          },
          labelClass,
        ])
      ">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <select
      :id="id"
      :value="modelValue"
      :class="cn(['rounded-md border-none bg-black/5 text-sm', selectClass])"
      readonly
      required
      @change="
        handleUpdateSelection(($event.target as HTMLSelectElement).value)
      ">
      <option value="" disabled selected>{{ placeholder }}</option>
      <option v-for="opt in options" :key="opt.id" :value="opt.id">
        {{ opt.label }}
      </option>
    </select>
  </div>
</template>
<script setup lang="ts">
import { cn } from "@/lib/utils";
import { CSSClass } from "@/types";

withDefaults(
  defineProps<{
    modelValue: string | number | null;
    label: string;
    options: Array<{
      id: string | number;
      label: string;
    }>;
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
  (e: "update:modelValue", value: string | number | null): void;
}>();

function handleUpdateSelection(value: string | number) {
  // if the value is empty, set it to null
  if (value === "") {
    return emit("update:modelValue", null);
  }

  // if the value is a number, convert it to a number
  const maybeNumber = Number(value);
  if (Number.isInteger(maybeNumber)) {
    return emit("update:modelValue", maybeNumber);
  }

  // otherwise, return the value as a string
  return emit("update:modelValue", value);
}
</script>
<style scoped></style>
