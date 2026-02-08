<template>
  <div
    :class="[
      'notification max-w-lg w-full mx-auto overflow-hidden relative shadow',
      {
        'notification--info bg-info-container text-on-info-container':
          type === 'info',
        'notification--warning bg-warning-container text-on-warning-container':
          type === 'warning',
        'notification--error bg-error-container text-on-error-container':
          type === 'danger',
        'notification--success bg-success-container text-on-success-container':
          type === 'success',
      },
    ]">
    <button
      v-if="isDismissable"
      class="absolute top-0 right-0 p-4"
      @click="$emit('dismiss')">
      <span class="sr-only">Close</span>
      <XIcon />
    </button>
    <div
      class="flex gap-4 p-4 border border-l-8 items-start rounded-md"
      :class="{
        'border-info': type === 'info',
        'border-warning': type === 'warning',
        'border-error': type === 'danger',
        'border-success': type === 'success',
      }">
      <div class="notification__icon rounded-full p-2 -mt-1">
        <WarningIcon v-if="type === 'warning'" />
        <InfoIcon v-if="type === 'info'" />
        <CircleCheckIcon v-if="type === 'success'" />
        <CircleXIcon v-if="type === 'danger'" />
      </div>
      <div class="flex-1">
        <h3 class="notification__title text-sm font-bold uppercase pr-6">
          {{ title }}
        </h3>
        <div class="notification__contents mt-2 text-sm">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { WarningIcon, InfoIcon, CircleCheckIcon, CircleXIcon } from "@/icons";
import XIcon from "@/icons/XIcon.vue";

withDefaults(
  defineProps<{
    title?: string;
    type?: "warning" | "info" | "success" | "danger";
    isDismissable?: boolean;
  }>(),
  {
    title: "Heads Up",
    type: "info",
    isDismissable: false,
  }
);

defineEmits<{
  (eventName: "dismiss"): void;
}>();
</script>
<style scoped></style>
