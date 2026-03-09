<template>
  <label class="toggle inline-flex items-center gap-1.5 cursor-pointer">
    <span v-if="offLabel" class="text-sm">{{ offLabel }}</span>
    <SwitchRoot
      :modelValue="modelValue"
      :aria-label="settingLabel"
      class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-[3px] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 data-[state=checked]:bg-primary data-[state=unchecked]:bg-surface-container-highest"
      @update:modelValue="(val) => $emit('update:modelValue', val)">
      <SwitchThumb
        class="pointer-events-none block h-3.5 w-3.5 rounded-full shadow ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=checked]:bg-on-primary data-[state=unchecked]:translate-x-0 data-[state=unchecked]:bg-outline" />
    </SwitchRoot>
    <span v-if="onLabel" :class="onLabelClass">{{ onLabel }}</span>
  </label>
</template>

<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from "reka-ui";

type CSSClass = Record<string, boolean> | string[] | string;

defineProps<{
  modelValue: boolean;
  settingLabel: string;
  offLabel?: string;
  onLabel?: string;
  onLabelClass?: CSSClass;
}>();

defineEmits<{
  (eventName: "update:modelValue", value: boolean): void;
}>();
</script>
