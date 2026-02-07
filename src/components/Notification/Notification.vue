<template>
  <div
    class="notification rounded-md max-w-lg w-full mx-auto overflow-hidden relative">
    <button
      v-if="isDismissable"
      class="absolute top-0 right-0 p-4"
      @click="$emit('dismiss')">
      <span class="sr-only">Close</span>
      <XIcon />
    </button>
    <div
      class="flex gap-4 p-4 border-l-8 items-start"
      :class="{
        'notification--info border-l-primary': type === 'info',
        'notification--warning border-l-yellow-300': type === 'warning',
        'notification--error border-l-red-600': type === 'danger',
        'notification--success border-l-green-400': type === 'success',
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
<style scoped>
.notification {
  background: var(--surface-container-low);
  color: var(--on-surface);
  border-color: var(--outline-variant);
}

[data-theme="dark"] .notification {
  background: var(--surface-container);
}

.notification__title {
  color: var(--on-surface);
}

.notification__icon {
  background: var(--info-container);
  color: var(--on-info-container);
}

.notification--warning .notification__icon {
  background: var(--warning-container);
  color: var(--on-warning-container);
}

.notification--error .notification__icon {
  background: var(--error-container);
  color: var(--on-error-container);
}

.notification--success .notification__icon {
  background: var(--success-container);
  color: var(--on-success-container);
}

/* Dark mode: use transparent bg with colored text for icons */
[data-theme="dark"] .notification__icon {
  background: transparent;
  color: var(--info);
}

[data-theme="dark"] .notification--warning .notification__icon {
  background: transparent;
  color: var(--warning);
}

[data-theme="dark"] .notification--error .notification__icon {
  background: transparent;
  color: var(--error);
}

[data-theme="dark"] .notification--success .notification__icon {
  background: transparent;
  color: var(--success);
}
</style>
