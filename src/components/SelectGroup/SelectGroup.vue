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
        $emit('update:modelValue', ($event.target as HTMLSelectElement).value)
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
    modelValue: string;
    label: string;
    options: Array<{
      id: string;
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

defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();
</script>
<style scoped></style>
