<template>
  <div
    :class="[
      'notification max-w-lg w-full mx-auto overflow-hidden relative rounded-md',
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
      class="grid grid-cols-[auto_1fr] gap-x-4 p-4 pt-2 border border-l-8 rounded-md"
      :class="{
        'border-outline-variant': type === 'info',
        'border-warning': type === 'warning',
        'border-error': type === 'danger',
        'border-success': type === 'success',
      }">
      <div class="notification__icon rounded-full p-2 self-center">
        <WarningIcon v-if="type === 'warning'" />
        <InfoIcon v-if="type === 'info'" />
        <CircleCheckIcon v-if="type === 'success'" />
        <CircleAlertIcon
          v-if="type === 'danger'"
          class="w-5 h-5"
          :stroke-width="1.5" />
      </div>
      <h3
        class="notification__title text-sm font-bold uppercase pr-6 text-inherit self-center">
        {{ title }}
      </h3>
      <div class="notification__contents col-start-2 text-sm">
        <slot />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { WarningIcon, InfoIcon, CircleCheckIcon } from "@/icons";
import XIcon from "@/icons/XIcon.vue";
import { CircleAlertIcon } from "lucide-vue-next";

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
 * Per-variant tokens:
 * --icon-bg / --icon-fg  → icon circle background (via color-mix) and foreground
 * --primary remaps       → slotted buttons harmonize with the notification color
 */
.notification--info {
  --icon-tint: var(--on-surface);
  --icon-base: var(--surface-container-high);
  --icon-fg: var(--on-surface);
  --primary: var(--on-surface);
  --on-primary: var(--surface);
  --primary-container: var(--surface-container-highest);
  --on-primary-container: var(--on-surface);
}

.notification--warning {
  --icon-tint: var(--warning);
  --icon-base: var(--warning-container);
  --icon-fg: var(--on-warning-container);
  --primary: var(--warning);
  --on-primary: var(--on-warning);
  --primary-container: var(--warning-container);
  --on-primary-container: var(--on-warning-container);
}

.notification--error {
  --icon-tint: var(--error);
  --icon-base: var(--error-container);
  --icon-fg: var(--on-error-container);
  --primary: var(--error);
  --on-primary: var(--on-error);
  --primary-container: var(--error-container);
  --on-primary-container: var(--on-error-container);
}

.notification--success {
  --icon-tint: var(--success);
  --icon-base: var(--success-container);
  --icon-fg: var(--on-success-container);
  --primary: var(--success);
  --on-primary: var(--on-success);
  --primary-container: var(--success-container);
  --on-primary-container: var(--on-success-container);
}

.notification__icon {
  background: color-mix(in oklch, var(--icon-tint) 15%, var(--icon-base));
  color: var(--icon-fg);
}
</style>
