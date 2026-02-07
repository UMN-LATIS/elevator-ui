<template>
  <div class="flex items-center justify-between gap-4 flex-wrap">
    <label
      :id="labelId"
      class="text-sm text-on-surface cursor-pointer"
      @click="$emit('update:modelValue', !modelValue)">
      {{ label }}
    </label>
    <Toggle
      :modelValue="modelValue"
      :settingLabel="label"
      @update:modelValue="$emit('update:modelValue', $event)" />
  </div>
</template>

<script setup lang="ts">
import { useId } from "vue";
import Toggle from "@/components/Toggle/Toggle.vue";

defineProps<{
  modelValue: boolean;
  label: string;
}>();

defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const labelId = useId();
</script>
