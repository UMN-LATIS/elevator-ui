<template>
  <div
    class="notification rounded-md max-w-lg mx-auto border overflow-hidden relative"
  >
    <button
      v-if="isDismissable"
      class="absolute top-0 right-0 p-4"
      @click="$emit('dismiss')"
    >
      <span class="sr-only">Close</span>
      <XIcon />
    </button>
    <div
      class="flex gap-4 p-4 border-l-8 items-start"
      :class="{
        'notification--info border-l-blue-600': type === 'info',
        'notification--warning border-l-yellow-300': type === 'warning',
        'notification--error border-l-red-400': type === 'error',
        'notification--success border-l-green-400': type === 'success',
      }"
    >
      <div class="notification__icon rounded-full p-2 -mt-1">
        <WarningIcon v-if="type === 'warning'" />
        <InfoIcon v-if="type === 'info'" />
        <CircleCheckIcon v-if="type === 'success'" />
        <CircleXIcon v-if="type === 'error'" />
      </div>
      <div>
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
    type?: "warning" | "info" | "error" | "success";
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
