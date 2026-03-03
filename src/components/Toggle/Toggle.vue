<template>
  <SwitchGroup class="toggle">
    <div class="inline-flex items-center gap-1.5">
      <SwitchLabel v-if="offLabel" :class="offLabelClass">
        {{ offLabel }}
      </SwitchLabel>
      <Switch
        :modelValue="modelValue"
        :class="[
          modelValue ? 'bg-primary' : 'bg-surface-container-highest',
          'relative inline-flex items-center h-5 w-9 flex-shrink-0 cursor-pointer rounded-full p-[3px] transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
          toggleClass,
          modelValue ? toggleOnClass : toggleOffClass,
        ]"
        @update:modelValue="(val) => $emit('update:modelValue', val)">
        <span class="sr-only">{{ settingLabel }}</span>
        <span
          aria-hidden="true"
          :class="[
            'pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
            modelValue ? 'translate-x-4' : 'translate-x-0',
          ]" />
      </Switch>
      <SwitchLabel v-if="onLabel" :class="onLabelClass">
        {{ onLabel }}
      </SwitchLabel>
    </div>
  </SwitchGroup>
</template>

<script setup lang="ts">
import { Switch, SwitchGroup, SwitchLabel } from "@headlessui/vue";

type CSSClass = Record<string, boolean> | string[] | string;

defineProps<{
  modelValue: boolean;
  settingLabel: string;
  offLabel?: string;
  onLabel?: string;
  toggleClass?: CSSClass;
  toggleOnClass?: CSSClass;
  toggleOffClass?: CSSClass;
  onLabelClass?: CSSClass;
  offLabelClass?: CSSClass;
}>();

defineEmits<{
  (eventName: "update:modelValue", value: boolean): void;
}>();
</script>
