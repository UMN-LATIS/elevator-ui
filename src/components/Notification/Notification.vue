<template>
  <div
    :class="[
      'notification max-w-lg w-full mx-auto overflow-hidden relative shadow rounded-md',
      {
        'notification--info bg-surface-container-high text-on-surface':
          type === 'info',
        'notification--warning bg-warning-container text-on-warning-container':
          type === 'warning',
        'notification--error bg-error-container text-on-error-container':
          type === 'danger',
        'notification--success bg-success-container text-on-success-container':
          type === 'success',
      },
      $attrs.class,
    ]">
    <button
      v-if="isDismissable"
      class="absolute top-0 right-0 p-4"
      @click="$emit('dismiss')">
      <span class="sr-only">Close</span>
      <XIcon />
    </button>
    <div
      class="grid grid-cols-[auto_1fr] gap-x-4 p-4 border border-l-8 rounded-md"
      :class="{
        'border-outline-variant': type === 'info',
        'border-warning': type === 'warning',
        'border-error': type === 'danger',
        'border-success': type === 'success',
      }">
      <div
        class="notification__icon rounded-full p-2 self-center"
        :class="{
          'bg-outline-variant text-on-surface-variant': type === 'info',
          'bg-warning text-on-warning': type === 'warning',
          'bg-success text-on-success': type === 'success',
          'bg-error text-on-error': type === 'danger',
        }">
        <WarningIcon v-if="type === 'warning'" />
        <InfoIcon v-if="type === 'info'" />
        <CircleCheckIcon v-if="type === 'success'" />
        <CircleXIcon v-if="type === 'danger'" />
      </div>
      <h3
        class="notification__title text-sm font-bold uppercase pr-6 text-inherit self-center">
        {{ title }}
      </h3>
      <div class="notification__contents col-start-2 mt-2 text-sm">
        <slot />
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
/*
 * Remap primary tokens so any slotted buttons (login links, confirm actions,
 * etc.) harmonize with the notification's color family. Works across all
 * themes because it aliases existing M3 role tokens.
 */
.notification--info {
  --primary: var(--on-surface);
  --on-primary: var(--surface);
  --primary-container: var(--surface-container-highest);
  --on-primary-container: var(--on-surface);
}

.notification--warning {
  --primary: var(--warning);
  --on-primary: var(--on-warning);
  --primary-container: var(--warning-container);
  --on-primary-container: var(--on-warning-container);
}

.notification--error {
  --primary: var(--error);
  --on-primary: var(--on-error);
  --primary-container: var(--error-container);
  --on-primary-container: var(--on-error-container);
}

.notification--success {
  --primary: var(--success);
  --on-primary: var(--on-success);
  --primary-container: var(--success-container);
  --on-primary-container: var(--on-success-container);
}
</style>
