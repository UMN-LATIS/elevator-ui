<template>
  <div
    class="notification rounded-md max-w-lg mx-auto border border-neutral-200 overflow-hidden"
  >
    <div class="flex gap-4">
      <div
        class="p-2 border-l-4"
        :class="{
          'notification--info border-l-blue-600': type === 'info',
          'notification--warning border-l-yellow-300': type === 'warning',
          'notification--error border-l-red-400': type === 'error',
          'notification--success border-l-green-400': type === 'success',
        }"
      >
        <div class="notification__icon rounded-full p-2">
          <WarningIcon v-if="type === 'warning'" />
          <InfoIcon v-if="type === 'info'" />
          <CircleCheckIcon v-if="type === 'success'" />
          <CircleXIcon v-if="type === 'error'" />
        </div>
      </div>
      <div class="py-4">
        <h3 class="notification__title text-sm font-bold uppercase">
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

withDefaults(
  defineProps<{
    title?: string;
    type?: "warning" | "info" | "error" | "success";
  }>(),
  {
    title: "Heads Up",
    type: "info",
  }
);
</script>
<style scoped>
.notification {
  background: var(--app-notification-backgroundColor);
  color: var(--app-notification-textColor);
  border-color: var(--app-notification-borderColor);
}

.notification__title {
  background: var(--app-notification-header-backgroundColor);
  color: var(--app-notification-header-textColor);
}
.notification__icon {
  background: var(--app-notification-icon-info-backgroundColor);
  color: var(--app-notification-icon-info-textColor);
}
.notification--warning .notification__icon {
  background: var(--app-notification-icon-warning-backgroundColor);
  color: var(--app-notification-icon-warning-textColor);
}
.notification--error .notification__icon {
  background: var(--app-notification-icon-error-backgroundColor);
  color: var(--app-notification-icon-error-textColor);
}
.notification--success .notification__icon {
  background: var(--app-notification-icon-success-backgroundColor);
  color: var(--app-notification-icon-success-textColor);
}
</style>
