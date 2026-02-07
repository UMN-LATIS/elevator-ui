<template>
  <component
    :is="componentType"
    class="button inline-flex items-center gap-1 no-underline hover:no-underline rounded justify-center leading-none transition-colors ease-in-out group cursor-pointer"
    :class="{
      'button--primary px-4 py-3': variant === 'primary',
      'button--secondary px-4 py-3': variant === 'secondary',
      'button--tertiary text-xs uppercase font-medium p-2':
        variant === 'tertiary',
      'button--primary px-4 py-3 !bg-error !border-error !text-on-error hover:!bg-error/90 hover:!border-error/90':
        variant === 'danger',
    }"
    v-bind="$attrs"
    :to="componentType === RouterLink ? to : undefined"
    :href="resolvedHref"
    :type="componentType === 'button' ? type : undefined">
    <slot />
  </component>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, type RouteLocationRaw, useRouter } from "vue-router";

const props = withDefaults(
  defineProps<{
    href?: string;
    to?: RouteLocationRaw;
    variant?: "primary" | "secondary" | "tertiary" | "danger";
    type?: "button" | "submit" | "reset";
  }>(),
  {
    variant: "secondary",
    href: undefined,
    to: undefined,
    type: "button",
  }
);

const router = useRouter();
const resolvedHref = computed(() => {
  if (props.href) {
    return props.href;
  } else if (props.to && componentType.value === RouterLink) {
    // If `to` is an object, resolve it to a string URL
    return router.resolve(props.to).href;
  }
  return undefined;
});

const componentType = computed(() => {
  if (props.href) return "a";
  if (props.to) return RouterLink;
  return "button";
});
</script>
<style lang="postcss" scoped>
.button {
  border-width: 2px;
  border-style: solid;
}

/* Primary button: filled in light mode, outlined in dark mode */
.button--primary {
  color: oklch(var(--on-primary));
  background: oklch(var(--primary));
  border-color: oklch(var(--primary));

  &:hover {
    color: oklch(var(--on-primary));
    background: oklch(var(--primary) / 0.9);
    border-color: oklch(var(--primary) / 0.9);
  }

  &:active {
    color: oklch(var(--on-primary));
    background: oklch(var(--primary) / 0.8);
    border-color: oklch(var(--primary) / 0.8);
  }

  &:disabled {
    color: oklch(var(--on-surface-variant) / 0.38);
    background: oklch(var(--surface-container-high));
    border-color: oklch(var(--surface-container-high));
  }
}

/* Secondary button: outlined */
.button--secondary {
  color: oklch(var(--secondary));
  background: transparent;
  border-color: oklch(var(--secondary));

  &:hover {
    color: oklch(var(--on-secondary));
    background: oklch(var(--secondary));
    border-color: oklch(var(--secondary));
  }

  &:active {
    color: oklch(var(--on-secondary));
    background: oklch(var(--secondary) / 0.9);
    border-color: oklch(var(--secondary) / 0.9);
  }

  &:disabled {
    color: oklch(var(--on-surface) / 0.38);
    background: transparent;
    border-color: oklch(var(--on-surface) / 0.12);
  }
}

/* Tertiary button: text only, uses warm accent in dark mode */
.button--tertiary {
  color: oklch(var(--primary));
  background: transparent;
  border: none;

  &:hover {
    color: oklch(var(--primary));
    background: oklch(var(--primary-container) / 0.5);
  }

  &:active {
    color: oklch(var(--primary));
    background: oklch(var(--primary-container));
  }

  &:disabled {
    cursor: not-allowed;
    color: oklch(var(--on-surface) / 0.38);
    background: transparent;
  }
}
</style>
