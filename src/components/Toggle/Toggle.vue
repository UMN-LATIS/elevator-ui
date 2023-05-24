<template>
  <SwitchGroup>
    <div class="inline-flex items-center gap-1.5">
      <SwitchLabel v-if="offLabel">{{ offLabel }}</SwitchLabel>
      <Switch
        :modelValue="isOn"
        :class="[
          isOn ? 'bg-blue-600' : 'bg-neutral-200',
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2',
          toggleClass,
          isOn ? toggleOnClass : toggleOffClass,
        ]"
        @update:modelValue="$emit('toggle')"
      >
        <span class="sr-only">{{ settingLabel }}</span>
        <span
          aria-hidden="true"
          :class="[
            isOn ? 'translate-x-5' : 'translate-x-0',
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
          ]"
        />
      </Switch>
      <SwitchLabel v-if="onLabel"> {{ onLabel }}</SwitchLabel>
    </div>
  </SwitchGroup>
</template>

<script setup lang="ts">
import { Switch, SwitchGroup, SwitchLabel } from "@headlessui/vue";

type CSSClass = Record<string, boolean> | string[] | string;

defineProps<{
  isOn: boolean;
  settingLabel: string;
  offLabel?: string;
  onLabel?: string;
  toggleClass?: CSSClass;
  toggleOnClass?: CSSClass;
  toggleOffClass?: CSSClass;
}>();

defineEmits<{
  (eventName: "toggle");
}>();
</script>
