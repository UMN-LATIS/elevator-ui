<template>
  <div class="flex items-center justify-between gap-4 flex-wrap">
    <div class="flex items-center gap-1">
      <label
        :id="labelId"
        class="text-sm text-on-surface cursor-pointer"
        @click="$emit('update:modelValue', !modelValue)">
        {{ label }}
      </label>
      <Tooltip v-if="helpText" :tip="helpText" class="max-w-xs">
        <HelpCircleIcon class="size-4 text-on-surface-variant inline" />
      </Tooltip>
    </div>
    <Toggle
      :modelValue="modelValue"
      :settingLabel="label"
      @update:modelValue="$emit('update:modelValue', $event)" />
  </div>
</template>

<script setup lang="ts">
import { useId } from "vue";
import Toggle from "@/components/Toggle/Toggle.vue";
import Tooltip from "@/components/Tooltip/Tooltip.vue";
import { HelpCircleIcon } from "lucide-vue-next";

defineProps<{
  modelValue: boolean;
  label: string;
  helpText?: string;
}>();

defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const labelId = useId();
</script>
