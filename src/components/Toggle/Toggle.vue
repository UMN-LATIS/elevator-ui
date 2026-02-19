<template>
  <SwitchGroup class="toggle">
    <div class="inline-flex items-center gap-1.5">
      <SwitchLabel v-if="offLabel" :class="offLabelClass">
        {{ offLabel }}
      </SwitchLabel>
      <Switch
        :modelValue="modelValue"
        :class="[
          modelValue ? 'bg-primary-container' : 'bg-surface-container',
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-outline-variant transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          toggleClass,
          modelValue ? toggleOnClass : toggleOffClass,
        ]"
        @update:modelValue="(val) => $emit('update:modelValue', val)">
        <span class="sr-only">{{ settingLabel }}</span>
        <span
          aria-hidden="true"
          :class="[
            'pointer-events-none inline-block h-5 w-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out',
            modelValue
              ? 'translate-x-5 bg-on-primary-container'
              : 'translate-x-0 bg-on-surface-variant',
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
